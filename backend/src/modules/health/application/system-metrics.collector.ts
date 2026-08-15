import { statfs } from 'node:fs/promises';
import * as os from 'node:os';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  SYSTEM_METRIC_IDS,
  SYSTEM_METRICS_DISK_PATH,
  type SystemMetricId,
} from '../domain/system-metrics.constants';
import {
  type SystemMetricSample,
  SystemMetricsStore,
} from '../infrastructure/system-metrics.store';

interface CpuSampleState {
  timestampMs: number;
  processUsage: NodeJS.CpuUsage;
  systemIdle: number;
  systemTotal: number;
}

@Injectable()
export class SystemMetricsCollectorService implements OnModuleInit {
  private readonly logger = new Logger(SystemMetricsCollectorService.name);
  private previousCpuSample: CpuSampleState | null = null;
  private lastSample: SystemMetricSample | null = null;

  constructor(private readonly systemMetricsStore: SystemMetricsStore) {}

  onModuleInit() {
    void this.collectSample().catch((error) => {
      this.logger.warn(`Initial system metrics sample failed: ${this.formatError(error)}`);
    });
  }

  @Cron('*/30 * * * * *', {
    name: 'system-metrics-sample',
    waitForCompletion: true,
  })
  async collectSample() {
    const sample = await this.createSample();
    this.lastSample = sample;
    await this.systemMetricsStore.appendSample(sample);
  }

  async ensureTodaySample(dateKey: string) {
    const points = await this.systemMetricsStore.getSeries(dateKey, 'cpu_system');
    if (points.length > 0) {
      return;
    }

    await this.collectSample();
  }

  async getLatestSnapshotSample(): Promise<SystemMetricSample> {
    const memoryUsage = process.memoryUsage();
    const diskMetrics = await this.readDiskMetrics().catch((error) => {
      this.logger.warn(`Disk metrics read failed: ${this.formatError(error)}`);
      return { used: 0, free: 0, total: 0, path: SYSTEM_METRICS_DISK_PATH };
    });
    const collectedAt = new Date().toISOString();

    if (!this.lastSample) {
      return this.createSample();
    }

    return {
      collectedAt,
      values: {
        ...this.lastSample.values,
        heap_used: memoryUsage.heapUsed,
        heap_total: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        system_free_mem: os.freemem(),
        system_total_mem: os.totalmem(),
        cpu_system: this.lastSample.values.cpu_system ?? 0,
        cpu_process: this.lastSample.values.cpu_process ?? 0,
        disk_used: diskMetrics.used,
        disk_free: diskMetrics.free,
      },
    };
  }

  async createSample(): Promise<SystemMetricSample> {
    const memoryUsage = process.memoryUsage();
    const collectedAt = new Date().toISOString();
    const cpuMetrics = this.readCpuMetrics();
    const diskMetrics = await this.readDiskMetrics().catch((error) => {
      this.logger.warn(`Disk metrics read failed: ${this.formatError(error)}`);
      return { used: 0, free: 0, total: 0, path: SYSTEM_METRICS_DISK_PATH };
    });

    const values = {
      heap_used: memoryUsage.heapUsed,
      heap_total: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
      system_free_mem: os.freemem(),
      system_total_mem: os.totalmem(),
      cpu_system: cpuMetrics.systemPct,
      cpu_process: cpuMetrics.processPct,
      disk_used: diskMetrics.used,
      disk_free: diskMetrics.free,
    } satisfies Record<SystemMetricId, number>;

    for (const metricId of SYSTEM_METRIC_IDS) {
      if (!Number.isFinite(values[metricId])) {
        throw new Error(`Invalid metric value for ${metricId}`);
      }
    }

    return { collectedAt, values };
  }

  private readCpuMetrics() {
    const timestampMs = Date.now();
    const processUsage = process.cpuUsage();
    const { idle: systemIdle, total: systemTotal } = this.getSystemCpuTotals();

    if (!this.previousCpuSample) {
      this.previousCpuSample = {
        timestampMs,
        processUsage,
        systemIdle,
        systemTotal,
      };
      return { systemPct: 0, processPct: 0 };
    }

    const elapsedUs = (timestampMs - this.previousCpuSample.timestampMs) * 1000;
    const processDeltaUs =
      processUsage.user -
      this.previousCpuSample.processUsage.user +
      (processUsage.system - this.previousCpuSample.processUsage.system);
    const systemIdleDelta = systemIdle - this.previousCpuSample.systemIdle;
    const systemTotalDelta = systemTotal - this.previousCpuSample.systemTotal;

    this.previousCpuSample = {
      timestampMs,
      processUsage,
      systemIdle,
      systemTotal,
    };

    if (elapsedUs <= 0) {
      return { systemPct: 0, processPct: 0 };
    }

    const processPct = Math.min(100, Math.max(0, (processDeltaUs / elapsedUs) * 100));
    const systemPct =
      systemTotalDelta > 0
        ? Math.min(100, Math.max(0, (1 - systemIdleDelta / systemTotalDelta) * 100))
        : 0;

    return { systemPct, processPct };
  }

  private getSystemCpuTotals() {
    let idle = 0;
    let total = 0;

    for (const cpu of os.cpus()) {
      idle += cpu.times.idle;
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    }

    return { idle, total };
  }

  private async readDiskMetrics() {
    const stats = await statfs(SYSTEM_METRICS_DISK_PATH);
    const total = stats.bsize * stats.blocks;
    const free = stats.bsize * stats.bavail;
    const used = Math.max(0, total - free);

    return { total, free, used, path: SYSTEM_METRICS_DISK_PATH };
  }

  private formatError(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}

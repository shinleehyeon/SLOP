import { Injectable } from '@nestjs/common';
import { getKstDateKey } from '@/common/utils/kst-date';
import {
  SYSTEM_METRIC_IDS,
  SYSTEM_METRIC_LABELS,
  SYSTEM_METRIC_UNITS,
  SYSTEM_METRICS_DISK_PATH,
} from '../domain/system-metrics.constants';
import { SystemMetricsStore } from '../infrastructure/system-metrics.store';
import { SystemMetricsCollectorService } from './system-metrics.collector';

@Injectable()
export class SystemMetricsService {
  constructor(
    private readonly systemMetricsStore: SystemMetricsStore,
    private readonly systemMetricsCollectorService: SystemMetricsCollectorService,
  ) {}

  async getTodayMetrics(dateKey = getKstDateKey()) {
    await this.systemMetricsCollectorService.ensureTodaySample(dateKey);

    const snapshotSample = await this.systemMetricsCollectorService.getLatestSnapshotSample();
    const series = await Promise.all(
      SYSTEM_METRIC_IDS.map(async (id) => ({
        id,
        label: SYSTEM_METRIC_LABELS[id],
        unit: SYSTEM_METRIC_UNITS[id],
        points: await this.systemMetricsStore.getSeries(dateKey, id),
      })),
    );

    return {
      dateKey,
      snapshot: {
        collectedAt: snapshotSample.collectedAt,
        memory: {
          heapUsed: snapshotSample.values.heap_used,
          heapTotal: snapshotSample.values.heap_total,
          rss: snapshotSample.values.rss,
        },
        system: {
          freeMem: snapshotSample.values.system_free_mem,
          totalMem: snapshotSample.values.system_total_mem,
        },
        cpu: {
          systemPct: snapshotSample.values.cpu_system,
          processPct: snapshotSample.values.cpu_process,
        },
        storage: {
          path: SYSTEM_METRICS_DISK_PATH,
          used: snapshotSample.values.disk_used,
          free: snapshotSample.values.disk_free,
          total: snapshotSample.values.disk_used + snapshotSample.values.disk_free,
        },
        uptimeSec: Math.floor(process.uptime()),
      },
      series,
    };
  }
}

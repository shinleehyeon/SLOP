import { Injectable } from '@nestjs/common';
import { getKstDateKey, getSecondsUntilKstMidnight } from '@/common/utils/kst-date';
import { RedisService } from '@/infrastructure/redis/redis.service';
import {
  SYSTEM_METRIC_IDS,
  SYSTEM_METRICS_REDIS_PREFIX,
  type SystemMetricId,
} from '../domain/system-metrics.constants';

export interface SystemMetricSample {
  collectedAt: string;
  values: Record<SystemMetricId, number>;
}

export interface SystemMetricPoint {
  t: string;
  v: number;
}

@Injectable()
export class SystemMetricsStore {
  constructor(private readonly redisService: RedisService) {}

  private buildKey(dateKey: string, metricId: SystemMetricId) {
    return `${SYSTEM_METRICS_REDIS_PREFIX}:${dateKey}:${metricId}`;
  }

  async appendSample(sample: SystemMetricSample) {
    const collectedAtMs = Date.parse(sample.collectedAt);
    const dateKey = getKstDateKey(new Date(collectedAtMs));
    const ttlSeconds = getSecondsUntilKstMidnight(new Date(collectedAtMs));

    await Promise.all(
      SYSTEM_METRIC_IDS.map(async (metricId) => {
        const key = this.buildKey(dateKey, metricId);
        await this.redisService.zadd(key, collectedAtMs, String(sample.values[metricId]));
        await this.redisService.expire(key, ttlSeconds);
      }),
    );
  }

  async getSeries(dateKey: string, metricId: SystemMetricId): Promise<SystemMetricPoint[]> {
    const key = this.buildKey(dateKey, metricId);
    const entries = await this.redisService.zrangebyscore(key, '-inf', '+inf');

    const points: SystemMetricPoint[] = [];
    for (let index = 0; index < entries.length; index += 2) {
      const member = entries[index];
      const score = entries[index + 1];
      if (member === undefined || score === undefined) {
        continue;
      }

      points.push({
        t: new Date(Number(score)).toISOString(),
        v: Number(member),
      });
    }

    return points;
  }
}

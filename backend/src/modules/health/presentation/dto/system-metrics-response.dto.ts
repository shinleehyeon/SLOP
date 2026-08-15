import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SYSTEM_METRIC_IDS } from '../../domain/system-metrics.constants';

const MetricPointSchema = z.object({
  t: z.string().datetime(),
  v: z.number(),
});

const MetricSeriesSchema = z.object({
  id: z.enum(SYSTEM_METRIC_IDS),
  label: z.string(),
  unit: z.enum(['bytes', 'percent']),
  points: z.array(MetricPointSchema),
});

export const SystemMetricsResponseSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  snapshot: z.object({
    collectedAt: z.string().datetime(),
    memory: z.object({
      heapUsed: z.number().int().nonnegative(),
      heapTotal: z.number().int().nonnegative(),
      rss: z.number().int().nonnegative(),
    }),
    system: z.object({
      freeMem: z.number().int().nonnegative(),
      totalMem: z.number().int().nonnegative(),
    }),
    cpu: z.object({
      systemPct: z.number().min(0).max(100),
      processPct: z.number().min(0).max(100),
    }),
    storage: z.object({
      path: z.string(),
      used: z.number().int().nonnegative(),
      free: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    }),
    uptimeSec: z.number().int().nonnegative(),
  }),
  series: z.array(MetricSeriesSchema),
});

export class SystemMetricsResponseDto extends createZodDto(SystemMetricsResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const HealthIndicatorSchema = z
  .object({
    status: z.enum(['up', 'down']),
  })
  .catchall(z.unknown());

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'error', 'shutting_down']),
  info: z.record(z.string(), HealthIndicatorSchema).optional(),
  error: z.record(z.string(), HealthIndicatorSchema).optional(),
  details: z.record(z.string(), HealthIndicatorSchema),
});

export class HealthResponseDto extends createZodDto(HealthResponseSchema) {}

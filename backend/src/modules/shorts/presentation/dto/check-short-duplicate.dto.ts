import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CheckShortDuplicateRequestSchema = z.object({
  url: z.string().trim().url().max(2048),
});

export class CheckShortDuplicateRequestDto extends createZodDto(CheckShortDuplicateRequestSchema) {}

export const ShortDuplicateMatchSchema = z.object({
  jobId: z.string(),
  matchType: z.string(),
  duplicate: z.boolean(),
  similar: z.boolean(),
  score: z.number(),
  reasons: z.array(z.string()),
  title: z.string().nullable(),
  downloadUrl: z.string().nullable(),
  overlapUrls: z.array(z.string()),
});

export const CheckShortDuplicateResponseSchema = z.object({
  duplicate: z.boolean(),
  similar: z.boolean(),
  jobIds: z.array(z.string()),
  matches: z.array(ShortDuplicateMatchSchema),
});

export class CheckShortDuplicateResponseDto extends createZodDto(
  CheckShortDuplicateResponseSchema,
) {}

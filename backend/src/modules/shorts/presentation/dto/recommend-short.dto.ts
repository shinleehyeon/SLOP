import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RecommendShortResponseSchema = z.object({
  userId: z.string(),
  jobId: z.string(),
  title: z.string().nullable(),
  style: z.string().nullable(),
  tags: z.array(z.string()),
  downloadUrl: z.string().nullable(),
  vportSeriesId: z.string().nullable(),
  vportPublicUrl: z.string().nullable(),
  durationSec: z.number().nullable(),
  episodeCount: z.number().nullable(),
  matchScore: z.number().nullable(),
});

export class RecommendShortResponseDto extends createZodDto(RecommendShortResponseSchema) {}

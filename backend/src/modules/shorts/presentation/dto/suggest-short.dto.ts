import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ShortsStyleSchema } from '@/common/dto/onboarding.enums';

export const SuggestShortResponseSchema = z.object({
  title: z.string().nullable(),
  style: ShortsStyleSchema.nullable(),
  tags: z.array(z.string()),
  seriesId: z.string().nullable(),
  publicUrl: z.url().nullable(),
  downloadUrl: z.url().nullable(),
  durationSec: z.number().nullable(),
  episodeCount: z.number().int().nullable(),
  matchScore: z.number().int().nullable(),
});

export class SuggestShortResponseDto extends createZodDto(SuggestShortResponseSchema) {}

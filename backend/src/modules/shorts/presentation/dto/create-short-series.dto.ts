import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ShortsStyleSchema } from '@/common/dto/onboarding.enums';

export const CreateShortItemSchema = z.object({
  fileId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  tags: z.array(z.string().trim().min(1).max(50)).max(20),
});

export const CreateShortSeriesSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    style: ShortsStyleSchema,
    requestedSiteUrl: z.string().trim().url().max(2048).optional().nullable(),
    generationRequestId: z.string().min(1).optional(),
    generation_request_id: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    user_id: z.string().min(1).optional(),
    shorts: z.array(CreateShortItemSchema).min(1).max(50),
  })
  .transform((value) => ({
    title: value.title,
    style: value.style,
    requestedSiteUrl: value.requestedSiteUrl,
    generationRequestId: value.generationRequestId ?? value.generation_request_id,
    userId: value.userId ?? value.user_id,
    shorts: value.shorts,
  }));

export class CreateShortSeriesRequestDto extends createZodDto(CreateShortSeriesSchema) {}

export const ShortResponseSchema = z.object({
  id: z.string(),
  seriesId: z.string(),
  episodeNumber: z.number().int().positive(),
  title: z.string(),
  tags: z.array(z.string()),
  videoFileId: z.string(),
  videoFileUrl: z.url().nullable(),
  likeCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  likedByMe: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ShortSeriesResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  style: ShortsStyleSchema,
  requestedSiteUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  shorts: z.array(ShortResponseSchema),
});

export class ShortSeriesResponseDto extends createZodDto(ShortSeriesResponseSchema) {}

export const ShortSeriesSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  style: ShortsStyleSchema,
  requestedSiteUrl: z.string().nullable(),
  shortCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class ShortSeriesSummaryDto extends createZodDto(ShortSeriesSummarySchema) {}

export const ShortSeriesListResponseSchema = z.object({
  items: z.array(ShortSeriesSummarySchema),
});

export class ShortSeriesListResponseDto extends createZodDto(ShortSeriesListResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createPaginatedResponseSchema } from '@/common/dto/pagination.dto';

export const ShortListItemSchema = z.object({
  id: z.string(),
  seriesId: z.string(),
  seriesTitle: z.string(),
  episodeNumber: z.number().int().positive(),
  title: z.string(),
  tags: z.array(z.string()),
  videoFileUrl: z.string().nullable(),
  likeCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  likedByMe: z.boolean(),
  creatorUserId: z.string(),
  creatorName: z.string(),
  createdAt: z.iso.datetime(),
});

export class ShortListItemDto extends createZodDto(ShortListItemSchema) {}

export const ShortListResponseSchema = createPaginatedResponseSchema(ShortListItemSchema);

export class ShortListResponseDto extends createZodDto(ShortListResponseSchema) {}

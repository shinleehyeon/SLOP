import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createPaginatedResponseSchema } from '@/common/dto/pagination.dto';

export const ShortLikeToggleResponseSchema = z.object({
  shortId: z.string(),
  liked: z.boolean(),
  likeCount: z.number().int().nonnegative(),
});

export class ShortLikeToggleResponseDto extends createZodDto(ShortLikeToggleResponseSchema) {}

export const CreateShortCommentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export class CreateShortCommentRequestDto extends createZodDto(CreateShortCommentSchema) {}

export const ShortCommentAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  profileImageUrl: z.string().nullable(),
});

export const ShortCommentResponseSchema = z.object({
  id: z.string(),
  shortId: z.string(),
  content: z.string(),
  author: ShortCommentAuthorSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class ShortCommentResponseDto extends createZodDto(ShortCommentResponseSchema) {}

export const ShortCommentListResponseSchema = createPaginatedResponseSchema(
  ShortCommentResponseSchema,
);

export class ShortCommentListResponseDto extends createZodDto(ShortCommentListResponseSchema) {}

export const DeleteShortCommentResponseSchema = z.object({
  id: z.string(),
  deleted: z.literal(true),
});

export class DeleteShortCommentResponseDto extends createZodDto(DeleteShortCommentResponseSchema) {}

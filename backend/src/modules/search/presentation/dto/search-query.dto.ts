import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SearchTypeSchema = z.enum(['account', 'short']);

export const SearchQueryRequestSchema = z.object({
  q: z.string().trim().min(1).max(200),
  types: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) {
        return ['account', 'short'] as const;
      }
      const parts = value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      const parsed = parts.map((part) => SearchTypeSchema.parse(part));
      return parsed.length > 0 ? parsed : (['account', 'short'] as const);
    }),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export class SearchQueryRequestDto extends createZodDto(SearchQueryRequestSchema) {}

export const SearchQueryAccountSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  shortSeriesCount: z.number().int().nonnegative(),
  profileImageUrl: z.string().nullable(),
});

export const SearchQueryShortSchema = z.object({
  shortId: z.string(),
  seriesId: z.string(),
  title: z.string(),
  seriesTitle: z.string(),
  tags: z.array(z.string()),
  videoUrl: z.string(),
  creatorUserId: z.string(),
  creatorName: z.string(),
  createdAt: z.string(),
});

export const SearchQueryResponseSchema = z.object({
  query: z.string(),
  accounts: z.array(SearchQueryAccountSchema),
  shorts: z.array(SearchQueryShortSchema),
});

export class SearchQueryResponseDto extends createZodDto(SearchQueryResponseSchema) {}

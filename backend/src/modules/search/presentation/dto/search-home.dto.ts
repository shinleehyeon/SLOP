import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SearchRecommendedAccountSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  shortSeriesCount: z.number().int().nonnegative(),
  profileImageUrl: z.string().nullable(),
});

export const SearchExploreShortSchema = z.object({
  shortId: z.string(),
  seriesId: z.string(),
  title: z.string(),
  seriesTitle: z.string(),
  tags: z.array(z.string()),
  videoUrl: z.string(),
  creatorUserId: z.string(),
  creatorName: z.string(),
  likeCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  likedByMe: z.boolean(),
  createdAt: z.string(),
});

export const SearchHomeResponseSchema = z.object({
  recommendedAccounts: z.array(SearchRecommendedAccountSchema),
  exploreShorts: z.array(SearchExploreShortSchema),
});

export class SearchHomeResponseDto extends createZodDto(SearchHomeResponseSchema) {}

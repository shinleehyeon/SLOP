import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LearningWeekSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export const LearningSummarySchema = z.object({
  savedCount: z.number().int().nonnegative(),
  totalDragCount: z.number().int().nonnegative(),
  interestFieldCount: z.number().int().nonnegative(),
});

export const LearningFrequentExpressionSchema = z.object({
  id: z.string(),
  title: z.string(),
  definition: z.string(),
  dragCount: z.number().int().nonnegative(),
  sourceTitle: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  fieldName: z.string().nullable(),
});

export const LearningRecentExpressionSchema = z.object({
  id: z.string(),
  title: z.string(),
  fieldName: z.string().nullable(),
  sourceTitle: z.string().nullable(),
  savedAt: z.string(),
});

export const LearningFieldStatSchema = z.object({
  fieldId: z.string(),
  fieldName: z.string(),
  expressionCount: z.number().int().nonnegative(),
  dragCount: z.number().int().nonnegative(),
  percentage: z.number().int().min(0).max(100),
});

export const LearningRelatedShortSchema = z.object({
  shortId: z.string(),
  seriesId: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  videoUrl: z.string(),
  creatorName: z.string().nullable(),
});

export const LearningHomeResponseSchema = z.object({
  week: LearningWeekSchema,
  summary: LearningSummarySchema,
  frequentExpressions: z.array(LearningFrequentExpressionSchema),
  recentExpressions: z.array(LearningRecentExpressionSchema),
  fieldStats: z.array(LearningFieldStatSchema),
  relatedShorts: z.array(LearningRelatedShortSchema),
});

export class LearningHomeResponseDto extends createZodDto(LearningHomeResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  DifficultySchema,
  DisplayFormatSchema,
  ShortsStyleSchema,
  ToneSchema,
} from '@/common/dto/onboarding.enums';

export const CreateTextSummarySchema = z.object({
  text: z.string().trim().min(1).max(5000),
  context: z.string().trim().max(10_000).optional().nullable(),
});

export class CreateTextSummaryRequestDto extends createZodDto(CreateTextSummarySchema) {}

export const TextSummaryCitationSchema = z.object({
  url: z.url(),
  title: z.string().nullable(),
  snippet: z.string().nullable(),
});

export const TextSummaryAppliedProfileSchema = z.object({
  tone: ToneSchema,
  displayFormat: DisplayFormatSchema,
  shortsStyle: ShortsStyleSchema,
  fieldChoices: z.array(
    z.object({
      fieldName: z.string(),
      difficulty: DifficultySchema,
    }),
  ),
});

export const TextSummaryResponseSchema = z.object({
  originalText: z.string(),
  content: z.string(),
  citations: z.array(TextSummaryCitationSchema),
  expressionId: z.string(),
  appliedProfile: TextSummaryAppliedProfileSchema,
});

export class TextSummaryResponseDto extends createZodDto(TextSummaryResponseSchema) {}

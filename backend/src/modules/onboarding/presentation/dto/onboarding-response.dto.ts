import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  DifficultySchema,
  DisplayFormatSchema,
  ShortsStyleSchema,
  ToneSchema,
} from '@/common/dto/onboarding.enums';

export const OnboardingProfileResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tone: ToneSchema,
  displayFormat: DisplayFormatSchema,
  shortsStyle: ShortsStyleSchema,
  completedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const UserFieldChoiceItemResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fieldId: z.string(),
  fieldName: z.string(),
  difficulty: DifficultySchema,
  createdAt: z.iso.datetime(),
});

export const OnboardingSettingsResponseSchema = z.object({
  profile: OnboardingProfileResponseSchema.nullable(),
  fieldChoices: z.array(UserFieldChoiceItemResponseSchema),
});

export class OnboardingSettingsResponseDto extends createZodDto(OnboardingSettingsResponseSchema) {}

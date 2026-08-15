import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  DifficultySchema,
  DisplayFormatSchema,
  ShortsStyleSchema,
  ToneSchema,
} from '@/common/dto/onboarding.enums';

const fieldChoicesExample = [
  { fieldName: '인공지능', difficulty: 'HARD' },
  { fieldName: '금융', difficulty: 'MEDIUM' },
] as const;

export const FieldChoiceInputSchema = z.object({
  fieldName: z.string().trim().min(1).max(100).meta({
    description: '관심 분야 이름',
    example: '인공지능',
  }),
  difficulty: DifficultySchema.meta({
    description: '해당 분야의 난이도',
    example: 'HARD',
  }),
});

export const SaveOnboardingSettingsSchema = z
  .object({
    tone: ToneSchema.meta({ example: 'CASUAL' }),
    displayFormat: DisplayFormatSchema.meta({ example: 'QNA' }),
    shortsStyle: ShortsStyleSchema.meta({ example: 'INFO' }),
    fieldChoices: z.array(FieldChoiceInputSchema).max(20).default([]).meta({
      description: '관심 분야 선택 목록 (전체 교체)',
      example: fieldChoicesExample,
    }),
  })
  .meta({
    example: {
      tone: 'CASUAL',
      displayFormat: 'QNA',
      shortsStyle: 'INFO',
      fieldChoices: fieldChoicesExample,
    },
  });

export class SaveOnboardingSettingsRequestDto extends createZodDto(SaveOnboardingSettingsSchema) {}

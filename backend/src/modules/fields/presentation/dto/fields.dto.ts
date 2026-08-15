import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DifficultySchema, ToneSchema } from '@/common/dto/onboarding.enums';

export const GenerateFieldTermsSchema = z.object({
  fieldName: z.string().trim().min(1).max(100),
  tone: ToneSchema,
});

export class GenerateFieldTermsRequestDto extends createZodDto(GenerateFieldTermsSchema) {}

export const FieldTermItemResponseSchema = z.object({
  term: z.string(),
  easy: z.string(),
  medium: z.string(),
  hard: z.string(),
});

export const GenerateFieldTermsResponseSchema = z.object({
  field: z.string(),
  terms: z.array(FieldTermItemResponseSchema).length(2),
});

export class GenerateFieldTermsResponseDto extends createZodDto(GenerateFieldTermsResponseSchema) {}

export const SaveFieldChoiceSchema = z.object({
  fieldName: z.string().trim().min(1).max(100),
  difficulty: DifficultySchema,
});

export class SaveFieldChoiceRequestDto extends createZodDto(SaveFieldChoiceSchema) {}

export const UserFieldChoiceResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fieldId: z.string(),
  difficulty: DifficultySchema,
  createdAt: z.iso.datetime(),
});

export class UserFieldChoiceResponseDto extends createZodDto(UserFieldChoiceResponseSchema) {}

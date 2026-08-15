import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const VerifySmsCodeSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

export class VerifySmsCodeRequestDto extends createZodDto(VerifySmsCodeSchema) {}

export const ResendSmsVerificationSchema = z.object({
  userId: z.string().min(1),
  phone: z.string().trim().min(10).max(20),
});

export class ResendSmsVerificationRequestDto extends createZodDto(ResendSmsVerificationSchema) {}

export const ResendSmsVerificationResponseSchema = z.object({
  challengeId: z.string(),
  expiresIn: z.number().int().positive(),
});

export class ResendSmsVerificationResponseDto extends createZodDto(
  ResendSmsVerificationResponseSchema,
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const VerifyEmailCodeSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

export class VerifyEmailCodeRequestDto extends createZodDto(VerifyEmailCodeSchema) {}

export const ResendEmailVerificationSchema = z.object({
  userId: z.string().min(1),
  email: z.email().trim().toLowerCase(),
});

export class ResendEmailVerificationRequestDto extends createZodDto(
  ResendEmailVerificationSchema,
) {}

export const ResendEmailVerificationResponseSchema = z.object({
  challengeId: z.string(),
  expiresIn: z.number().int().positive(),
});

export class ResendEmailVerificationResponseDto extends createZodDto(
  ResendEmailVerificationResponseSchema,
) {}

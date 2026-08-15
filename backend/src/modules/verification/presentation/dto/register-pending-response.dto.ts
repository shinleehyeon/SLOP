import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterPendingResponseSchema = z.object({
  userId: z.string(),
  challengeId: z.string(),
  expiresIn: z.number().int().positive(),
  requiresVerification: z.literal(true),
});

export class RegisterPendingResponseDto extends createZodDto(RegisterPendingResponseSchema) {}

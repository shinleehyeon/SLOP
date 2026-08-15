import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DebugValidateRequestSchema = z.object({
  name: z.string().trim().min(1).max(30),
  email: z.email().trim().toLowerCase(),
});

export class DebugValidateRequestDto extends createZodDto(DebugValidateRequestSchema) {}

export const DebugValidateResponseSchema = z.object({
  ok: z.literal(true),
  name: z.string(),
  email: z.email(),
});

export class DebugValidateResponseDto extends createZodDto(DebugValidateResponseSchema) {}

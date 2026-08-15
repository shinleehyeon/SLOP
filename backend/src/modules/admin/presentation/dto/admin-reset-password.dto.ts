import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminResetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(72),
});

export class AdminResetPasswordRequestDto extends createZodDto(AdminResetPasswordSchema) {}

export const AdminResetPasswordResponseSchema = z.object({
  success: z.boolean(),
});

export class AdminResetPasswordResponseDto extends createZodDto(AdminResetPasswordResponseSchema) {}

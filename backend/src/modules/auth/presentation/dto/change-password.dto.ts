import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8).max(72),
});

export class ChangePasswordRequestDto extends createZodDto(ChangePasswordSchema) {}

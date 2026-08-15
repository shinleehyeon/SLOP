import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(72),
});

export class SetPasswordRequestDto extends createZodDto(SetPasswordSchema) {}

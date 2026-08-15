import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(72),
});

export class LoginRequestDto extends createZodDto(LoginSchema) {}

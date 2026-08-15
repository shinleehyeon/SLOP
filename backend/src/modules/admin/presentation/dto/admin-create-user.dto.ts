import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminCreateUserSchema = z.object({
  name: z.string().trim().min(1).max(30),
  email: z.email().trim().toLowerCase().optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: z.string().min(8).max(72),
  role: z.enum(['admin', 'user']).default('user'),
  emailVerifiedAt: z.iso.datetime().nullable().optional(),
  phoneVerifiedAt: z.iso.datetime().nullable().optional(),
});

export class AdminCreateUserRequestDto extends createZodDto(AdminCreateUserSchema) {}

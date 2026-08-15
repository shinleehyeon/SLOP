import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PhoneLoginSchema = z.object({
  phone: z.string().trim().min(10).max(20),
  password: z.string().min(1).max(72),
});

export class PhoneLoginRequestDto extends createZodDto(PhoneLoginSchema) {}

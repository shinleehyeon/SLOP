import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z
  .object({
    email: z.email().trim().toLowerCase(),
    name: z.string().trim().min(1).max(30),
    password: z.string().min(8).max(72),
    profileImageId: z.string().nullish(),
    uploadToken: z.string().min(32).nullish(),
  })
  .refine((value) => !value.profileImageId || Boolean(value.uploadToken), {
    message: 'uploadToken is required when profileImageId is provided',
    path: ['uploadToken'],
  });

export class RegisterRequestDto extends createZodDto(RegisterSchema) {}

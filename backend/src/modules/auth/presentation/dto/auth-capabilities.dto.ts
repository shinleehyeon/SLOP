import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AuthCapabilitiesSchema = z.object({
  verificationChannel: z.enum(['none', 'email', 'sms']),
  oauthEnabled: z.boolean(),
  loginWith: z.enum(['email', 'phone']),
  registerRequiresVerification: z.boolean(),
});

export class AuthCapabilitiesResponseDto extends createZodDto(AuthCapabilitiesSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AuthUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  role: z.enum(['admin', 'user']),
  profileImageId: z.string().nullable(),
});

const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const AuthTokenResponseSchema = z.object({
  tokens: AuthTokensSchema,
});

export const AuthResponseSchema = AuthTokenResponseSchema.extend({
  user: AuthUserSchema,
});

export const AuthSessionResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.email().optional(),
    role: z.enum(['admin', 'user']),
    roles: z.array(z.enum(['admin', 'user'])),
  }),
});

export const LogoutResponseSchema = z.object({
  success: z.boolean(),
});

export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}

export class AuthTokenResponseDto extends createZodDto(AuthTokenResponseSchema) {}

export class AuthSessionResponseDto extends createZodDto(AuthSessionResponseSchema) {}

export class LogoutResponseDto extends createZodDto(LogoutResponseSchema) {}

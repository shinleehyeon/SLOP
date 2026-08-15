import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserResponseSchema } from '@/modules/users/presentation/dto/user-response.dto';

export const OAuthAccountResponseSchema = z.object({
  id: z.string(),
  provider: z.enum(['google', 'github']),
  providerAccountId: z.string(),
  email: z.email().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const AdminUserDetailResponseSchema = UserResponseSchema.extend({
  phone: z.string().nullable(),
  emailVerifiedAt: z.iso.datetime().nullable(),
  phoneVerifiedAt: z.iso.datetime().nullable(),
  hasPassword: z.boolean(),
  oauthAccounts: z.array(OAuthAccountResponseSchema),
});

export const OAuthAccountListResponseSchema = z.object({
  items: z.array(OAuthAccountResponseSchema),
});

export class AdminUserDetailResponseDto extends createZodDto(AdminUserDetailResponseSchema) {}

export class OAuthAccountListResponseDto extends createZodDto(OAuthAccountListResponseSchema) {}

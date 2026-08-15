import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createPaginatedResponseSchema } from '@/common/dto/pagination.dto';

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  role: z.enum(['admin', 'user']),
  profileImageId: z.string().nullable(),
  profileImageUrl: z.url().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const UserListItemResponseSchema = UserResponseSchema.extend({
  oauthProviders: z.array(z.enum(['google', 'github'])),
});

export const OAuthAccountResponseSchema = z.object({
  id: z.string(),
  provider: z.enum(['google', 'github']),
  providerAccountId: z.string(),
  email: z.email().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const MeResponseSchema = UserResponseSchema.extend({
  oauthAccounts: z.array(OAuthAccountResponseSchema),
  hasPassword: z.boolean(),
});

export const DeleteUserResponseSchema = z.object({
  success: z.boolean(),
});

export const UnlinkOAuthResponseSchema = z.object({
  success: z.literal(true),
});

export const UserListResponseSchema = createPaginatedResponseSchema(UserListItemResponseSchema);

export class UserResponseDto extends createZodDto(UserResponseSchema) {}

export class MeResponseDto extends createZodDto(MeResponseSchema) {}

export class DeleteUserResponseDto extends createZodDto(DeleteUserResponseSchema) {}

export class UnlinkOAuthResponseDto extends createZodDto(UnlinkOAuthResponseSchema) {}

export class UserListResponseDto extends createZodDto(UserListResponseSchema) {}

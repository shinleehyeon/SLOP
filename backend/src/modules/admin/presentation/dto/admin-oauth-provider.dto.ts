import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OAuthProviderSchema } from '@/common/dto/oauth-provider.dto';

export { OAuthProviderSchema as AdminOAuthProviderSchema } from '@/common/dto/oauth-provider.dto';

export class AdminOAuthProviderParamDto extends createZodDto(
  z.object({
    provider: OAuthProviderSchema,
  }),
) {}

export const AdminUnlinkOAuthResponseSchema = z.object({
  success: z.boolean(),
});

export class AdminUnlinkOAuthResponseDto extends createZodDto(AdminUnlinkOAuthResponseSchema) {}

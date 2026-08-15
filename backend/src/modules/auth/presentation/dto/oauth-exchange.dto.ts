import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const OAuthExchangeSchema = z.object({
  code: z
    .string()
    .min(1)
    .describe('프론트 callback URL(`redirectUrl?code=...`)에서 받은 일회용 로그인 코드'),
});

export class OAuthExchangeRequestDto extends createZodDto(OAuthExchangeSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export class RefreshTokenRequestDto extends createZodDto(RefreshTokenSchema) {}

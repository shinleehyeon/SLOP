import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const VersionResponseSchema = z.object({
  version: z.string(),
});

export class VersionResponseDto extends createZodDto(VersionResponseSchema) {}

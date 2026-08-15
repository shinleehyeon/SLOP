import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CompleteAnonymousUploadSchema = z.object({
  uploadToken: z.string().min(32),
});

export class CompleteAnonymousUploadRequestDto extends createZodDto(
  CompleteAnonymousUploadSchema,
) {}

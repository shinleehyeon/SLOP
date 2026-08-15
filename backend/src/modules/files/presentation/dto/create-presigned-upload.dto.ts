import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FILE_PURPOSE_VALUES } from '../../application/file-purpose-policy';

export const FilePurposeSchema = z.enum(FILE_PURPOSE_VALUES);

export const CreatePresignedUploadSchema = z.object({
  purpose: FilePurposeSchema,
  originalName: z.string().trim().min(1).max(255).nullish(),
  contentType: z.string().trim().min(1).max(100),
  size: z.number().int().positive(),
});

export class CreatePresignedUploadRequestDto extends createZodDto(CreatePresignedUploadSchema) {}

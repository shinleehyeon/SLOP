import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FilePurposeSchema } from './create-presigned-upload.dto';

export const PresignedUploadResponseSchema = z.object({
  fileId: z.string(),
  uploadUrl: z.url(),
  method: z.literal('PUT'),
  headers: z.object({
    'Content-Type': z.string(),
  }),
  expiresAt: z.iso.datetime(),
});

export const AnonymousPresignedUploadResponseSchema = PresignedUploadResponseSchema.extend({
  uploadToken: z.string(),
});

export const FileResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'TEMPORARY', 'ATTACHED']),
  purpose: FilePurposeSchema,
  key: z.string(),
  publicUrl: z.url(),
  originalName: z.string().nullable(),
  contentType: z.string(),
  size: z.number().int(),
  ownerId: z.string().nullable(),
  attachedAt: z.iso.datetime().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class PresignedUploadResponseDto extends createZodDto(PresignedUploadResponseSchema) {}

export class AnonymousPresignedUploadResponseDto extends createZodDto(
  AnonymousPresignedUploadResponseSchema,
) {}

export class FileResponseDto extends createZodDto(FileResponseSchema) {}

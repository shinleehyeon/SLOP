import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  BULK_FILE_DELETE_MAX_ITEMS,
  BULK_FILE_UPLOAD_MAX_ITEMS,
} from '../../application/bulk-file-upload.constants';
import { CreatePresignedUploadSchema } from './create-presigned-upload.dto';
import {
  AnonymousPresignedUploadResponseSchema,
  FileResponseSchema,
  PresignedUploadResponseSchema,
} from './file-upload-response.dto';

export const BulkOperationFailureSchema = z.object({
  fileId: z.string(),
  message: z.string(),
});

export const BulkPresignedUploadItemSchema = CreatePresignedUploadSchema;

export const BulkPresignedUploadRequestSchema = z.object({
  files: z.array(BulkPresignedUploadItemSchema).min(1).max(BULK_FILE_UPLOAD_MAX_ITEMS),
});

export const AdminBulkPresignedUploadRequestSchema = BulkPresignedUploadRequestSchema.extend({
  ownerId: z.string().optional(),
});

export const BulkPresignedUploadResponseSchema = z.object({
  items: z.array(PresignedUploadResponseSchema),
});

export const BulkAnonymousPresignedUploadResponseSchema = z.object({
  items: z.array(AnonymousPresignedUploadResponseSchema),
});

export const BulkCompleteUploadRequestSchema = z.object({
  fileIds: z.array(z.string().trim().min(1)).min(1).max(BULK_FILE_UPLOAD_MAX_ITEMS),
});

export const BulkCompleteUploadResponseSchema = z.object({
  items: z.array(FileResponseSchema),
  failures: z.array(BulkOperationFailureSchema),
});

export const BulkDeleteFilesRequestSchema = z.object({
  fileIds: z.array(z.string().trim().min(1)).min(1).max(BULK_FILE_DELETE_MAX_ITEMS),
});

export const BulkDeleteFilesResponseSchema = z.object({
  deletedCount: z.number().int().nonnegative(),
  failures: z.array(BulkOperationFailureSchema),
});

export class BulkPresignedUploadRequestDto extends createZodDto(BulkPresignedUploadRequestSchema) {}

export class AdminBulkPresignedUploadRequestDto extends createZodDto(
  AdminBulkPresignedUploadRequestSchema,
) {}

export class BulkPresignedUploadResponseDto extends createZodDto(
  BulkPresignedUploadResponseSchema,
) {}

export class BulkAnonymousPresignedUploadResponseDto extends createZodDto(
  BulkAnonymousPresignedUploadResponseSchema,
) {}

export class BulkCompleteUploadRequestDto extends createZodDto(BulkCompleteUploadRequestSchema) {}

export class BulkCompleteUploadResponseDto extends createZodDto(BulkCompleteUploadResponseSchema) {}

export class BulkDeleteFilesRequestDto extends createZodDto(BulkDeleteFilesRequestSchema) {}

export class BulkDeleteFilesResponseDto extends createZodDto(BulkDeleteFilesResponseSchema) {}

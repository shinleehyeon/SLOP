import { createZodDto } from 'nestjs-zod';
import { AdminBulkPresignedUploadRequestSchema } from '@/modules/files/presentation/dto/bulk-file-upload.dto';

export class AdminBulkPresignedUploadRequestDto extends createZodDto(
  AdminBulkPresignedUploadRequestSchema,
) {}

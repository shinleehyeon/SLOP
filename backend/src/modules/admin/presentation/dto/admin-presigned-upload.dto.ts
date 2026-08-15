import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreatePresignedUploadSchema } from '@/modules/files/presentation/dto/create-presigned-upload.dto';

export const AdminCreatePresignedUploadSchema = CreatePresignedUploadSchema.extend({
  ownerId: z.string().optional(),
});

export class AdminCreatePresignedUploadRequestDto extends createZodDto(
  AdminCreatePresignedUploadSchema,
) {}

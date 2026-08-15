import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createPaginatedResponseSchema } from '@/common/dto/pagination.dto';
import { createListQuerySchema } from '@/common/list-query';
import { FileResponseSchema } from '@/modules/files/presentation/dto/file-upload-response.dto';

export const ADMIN_FILES_LIST_QUERY_CONFIG = {
  sortableFields: ['createdAt', 'size', 'originalName'] as const,
  defaultSort: { field: 'createdAt', order: 'desc' as const },
};

const stringFilterValue = z.union([
  z.string().trim().min(1),
  z.array(z.string().trim().min(1)).min(1),
]);

export const ListAdminFilesFiltersSchema = z
  .object({
    originalName: stringFilterValue.optional(),
    ownerId: z
      .union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)])
      .optional(),
    status: z
      .union([
        z.enum(['PENDING', 'TEMPORARY', 'ATTACHED']),
        z.array(z.enum(['PENDING', 'TEMPORARY', 'ATTACHED'])).min(1),
      ])
      .optional(),
    imagesOnly: z.boolean().optional(),
  })
  .strict();

export const AdminListFilesQuerySchema = createListQuerySchema({
  ...ADMIN_FILES_LIST_QUERY_CONFIG,
  filterSchema: ListAdminFilesFiltersSchema,
});

export const AdminFileUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  profileImageUrl: z.url().nullable(),
});

export const AdminFileLinkSchema = z.object({
  type: z.literal('profile_image'),
  user: AdminFileUserSchema,
});

export const AdminFileListItemSchema = FileResponseSchema.extend({
  owner: AdminFileUserSchema.nullable(),
  isLinked: z.boolean(),
  link: AdminFileLinkSchema.nullable(),
});

export const AdminFileListResponseSchema = createPaginatedResponseSchema(AdminFileListItemSchema);

export const DeleteFileResponseSchema = z.object({
  success: z.literal(true),
});

export class AdminListFilesQueryDto extends createZodDto(AdminListFilesQuerySchema) {}

export class AdminFileListResponseDto extends createZodDto(AdminFileListResponseSchema) {}

export class AdminFileDetailResponseDto extends createZodDto(AdminFileListItemSchema) {}

export class DeleteFileResponseDto extends createZodDto(DeleteFileResponseSchema) {}

export type ListAdminFilesFilters = z.infer<typeof ListAdminFilesFiltersSchema>;

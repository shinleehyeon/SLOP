import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BULK_USER_DELETE_MAX_ITEMS = 50;

export const BulkDeleteUsersRequestSchema = z.object({
  userIds: z.array(z.string().trim().min(1)).min(1).max(BULK_USER_DELETE_MAX_ITEMS),
});

export const BulkDeleteUsersFailureSchema = z.object({
  userId: z.string(),
  message: z.string(),
});

export const BulkDeleteUsersResponseSchema = z.object({
  deletedCount: z.number().int().nonnegative(),
  failures: z.array(BulkDeleteUsersFailureSchema),
});

export class BulkDeleteUsersRequestDto extends createZodDto(BulkDeleteUsersRequestSchema) {}

export class BulkDeleteUsersResponseDto extends createZodDto(BulkDeleteUsersResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createListQuerySchema } from '@/common/list-query';

export const USER_LIST_QUERY_CONFIG = {
  sortableFields: ['createdAt', 'name', 'email'] as const,
  defaultSort: { field: 'createdAt', order: 'desc' as const },
};

const stringFilterValue = z.union([
  z.string().trim().min(1),
  z.array(z.string().trim().min(1)).min(1),
]);

export const ListUsersFiltersSchema = z
  .object({
    name: stringFilterValue.optional(),
    email: stringFilterValue.optional(),
    role: z
      .union([z.enum(['admin', 'user']), z.array(z.enum(['admin', 'user'])).min(1)])
      .optional(),
  })
  .strict();

export const ListUsersQuerySchema = createListQuerySchema({
  ...USER_LIST_QUERY_CONFIG,
  filterSchema: ListUsersFiltersSchema,
});

export class ListUsersQueryDto extends createZodDto(ListUsersQuerySchema) {}

export type ListUsersFilters = z.infer<typeof ListUsersFiltersSchema>;

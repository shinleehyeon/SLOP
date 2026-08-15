import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createListQuerySchema } from '@/common/list-query';

export const AUDIT_LOG_LIST_QUERY_CONFIG = {
  sortableFields: ['createdAt', 'action'] as const,
  defaultSort: { field: 'createdAt', order: 'desc' as const },
};

export const ListAuditLogsFiltersSchema = z
  .object({
    action: z
      .union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)])
      .optional(),
    actorId: z
      .union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)])
      .optional(),
    status: z
      .union([z.enum(['SUCCESS', 'FAILURE']), z.array(z.enum(['SUCCESS', 'FAILURE'])).min(1)])
      .optional(),
  })
  .strict();

export const ListAuditLogsQuerySchema = createListQuerySchema({
  ...AUDIT_LOG_LIST_QUERY_CONFIG,
  filterSchema: ListAuditLogsFiltersSchema,
});

export class ListAuditLogsQueryDto extends createZodDto(ListAuditLogsQuerySchema) {}

export type ListAuditLogsFilters = z.infer<typeof ListAuditLogsFiltersSchema>;

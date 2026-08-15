import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createPaginatedResponseSchema } from '@/common/dto/pagination.dto';

export const AuditLogListItemSchema = z.object({
  id: z.string(),
  action: z.string(),
  status: z.enum(['SUCCESS', 'FAILURE']),
  actorId: z.string().nullable(),
  targetType: z.string().nullable(),
  targetId: z.string().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.iso.datetime(),
});

export const AuditLogListResponseSchema = createPaginatedResponseSchema(AuditLogListItemSchema);

export class AuditLogListResponseDto extends createZodDto(AuditLogListResponseSchema) {}

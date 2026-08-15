import { Injectable } from '@nestjs/common';
import {
  buildFiltersWhere,
  buildOrderBy,
  buildTextQueryWhere,
  combineWhere,
  containsWhereAny,
  type ResolvedListQuery,
  stringContainsFilter,
} from '@/common/list-query';
import { AuditLogStatus, Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { ListAuditLogsFilters } from '@/modules/admin/presentation/dto/admin-list-audit-logs.dto';

export interface CreateAuditLogInput {
  action: string;
  status: AuditLogStatus;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonObject;
}

interface FindManyPaginatedInput {
  listQuery: ResolvedListQuery<ListAuditLogsFilters>;
}

@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateAuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        status: input.status,
        actorId: input.actorId,
        targetType: input.targetType,
        targetId: input.targetId,
        requestId: input.requestId,
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: input.metadata,
      },
    });
  }

  async findManyPaginated(input: FindManyPaginatedInput) {
    const { listQuery } = input;
    const where = combineWhere(
      buildTextQueryWhere(listQuery.query, (query) => containsWhereAny(['action'], query)),
      buildFiltersWhere(listQuery.filters, listQuery.filterMatch, {
        action: stringContainsFilter('action'),
      }),
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: buildOrderBy(listQuery.sort),
        skip: listQuery.offset,
        take: listQuery.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
    };
  }
}

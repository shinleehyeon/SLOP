import { Injectable, Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { createPaginationMeta } from '@/common/dto/pagination.dto';
import { resolveListQuery } from '@/common/list-query';
import { AuditLogStatus, Prisma } from '@/generated/prisma/client';
import {
  AUDIT_LOG_LIST_QUERY_CONFIG,
  ListAuditLogsQueryDto,
} from '@/modules/admin/presentation/dto/admin-list-audit-logs.dto';
import { AuditLogRepository } from '../infrastructure/audit-log.repository';
import { AuditLogAction } from './audit-log.actions';

export interface RecordAuditLogInput {
  action: AuditLogAction;
  status?: AuditLogStatus;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonObject;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly cls: ClsService,
  ) {}

  record(input: RecordAuditLogInput) {
    const auditLog = {
      action: input.action,
      status: input.status ?? AuditLogStatus.SUCCESS,
      actorId: input.actorId ?? this.cls.get('userId'),
      targetType: input.targetType,
      targetId: input.targetId,
      requestId: this.cls.get('requestId'),
      ip: this.cls.get('ip'),
      userAgent: this.cls.get('userAgent'),
      metadata: input.metadata,
    };

    this.logSummary(auditLog);

    setImmediate(() => {
      void this.auditLogRepository.create(auditLog).catch((error: unknown) => {
        this.logger.warn(`Failed to persist audit log: ${this.formatError(error)}`);
      });
    });
  }

  async listPaginated(query: ListAuditLogsQueryDto) {
    const listQuery = resolveListQuery(query, AUDIT_LOG_LIST_QUERY_CONFIG);
    const { items, total } = await this.auditLogRepository.findManyPaginated({ listQuery });

    return {
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        status: item.status,
        actorId: item.actorId,
        targetType: item.targetType,
        targetId: item.targetId,
        metadata: item.metadata,
        createdAt: item.createdAt.toISOString(),
      })),
      meta: createPaginationMeta({
        page: query.page,
        limit: query.limit,
        total,
      }),
    };
  }

  private logSummary(input: {
    action: string;
    status: AuditLogStatus;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    requestId?: string;
  }) {
    this.logger.log(
      [
        `action=${input.action}`,
        `status=${input.status}`,
        input.actorId ? `actorId=${input.actorId}` : undefined,
        input.targetType ? `targetType=${input.targetType}` : undefined,
        input.targetId ? `targetId=${input.targetId}` : undefined,
        input.requestId ? `requestId=${input.requestId}` : undefined,
      ]
        .filter(Boolean)
        .join(' '),
    );
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}

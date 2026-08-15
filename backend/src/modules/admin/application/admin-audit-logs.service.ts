import { Injectable } from '@nestjs/common';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { ListAuditLogsQueryDto } from '../presentation/dto/admin-list-audit-logs.dto';

@Injectable()
export class AdminAuditLogsService {
  constructor(private readonly auditLogService: AuditLogService) {}

  listLogs(query: ListAuditLogsQueryDto) {
    return this.auditLogService.listPaginated(query);
  }
}

import { Global, Module } from '@nestjs/common';
import { AuditLogService } from './application/audit-log.service';
import { AuditLogRepository } from './infrastructure/audit-log.repository';

@Global()
@Module({
  providers: [AuditLogRepository, AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}

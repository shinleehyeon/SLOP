import { Controller, Get, Query } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { ApiListQuery } from '@/common/decorators/api-list-query.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { AdminAuditLogsService } from '../application/admin-audit-logs.service';
import { AuditLogListResponseDto } from '../presentation/dto/admin-audit-log.dto';
import { ListAuditLogsQueryDto } from '../presentation/dto/admin-list-audit-logs.dto';

@Controller('admin/audit-logs')
@ApiController({
  tag: OPENAPI_TAGS.adminAuditLogs,
  group: OPENAPI_GROUPS.admin,
  description: '관리자 감사 로그 API',
})
export class AdminAuditLogsController {
  constructor(private readonly adminAuditLogsService: AdminAuditLogsService) {}

  @Get()
  @RequirePermissions(RBAC.auditLog.list)
  @ApiListQuery({
    filtersExample: '{"status":"SUCCESS","action":"auth.login"}',
    sortExample: '-createdAt',
  })
  @ApiEndpoint({
    title: '감사 로그 목록 조회',
    description: '관리자가 감사 로그를 페이지네이션으로 조회합니다.',
    status: 200,
    response: AuditLogListResponseDto,
    errorStatuses: [401, 403],
  })
  listLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.adminAuditLogsService.listLogs(query);
  }
}

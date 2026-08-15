import { Controller, Get } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { SystemMetricsService } from '@/modules/health/application/system-metrics.service';
import { SystemMetricsResponseDto } from '@/modules/health/presentation/dto/system-metrics-response.dto';

@Controller('admin/system/metrics')
@ApiController({
  tag: OPENAPI_TAGS.adminSystem,
  group: OPENAPI_GROUPS.admin,
  description: '관리자 서버 메트릭 API',
})
export class AdminSystemMetricsController {
  constructor(private readonly systemMetricsService: SystemMetricsService) {}

  @Get()
  @RequirePermissions(RBAC.system.readMetrics)
  @ApiEndpoint({
    title: '오늘 서버 메트릭 조회',
    description:
      'Node.js 프로세스 및 OS 메모리 샘플을 Redis에 저장한 오늘(KST) 시계열 데이터를 반환합니다.',
    status: 200,
    response: SystemMetricsResponseDto,
    errorStatuses: [401, 403],
  })
  getTodayMetrics() {
    return this.systemMetricsService.getTodayMetrics();
  }
}

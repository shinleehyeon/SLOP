import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { SYSTEM_HEALTH_API_CONTROLLER } from '@/common/openapi/openapi-meta';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RedisHealthIndicator } from '../infrastructure/redis-health.indicator';
import { HealthResponseDto } from './dto/health-response.dto';

@SkipThrottle({ default: true })
@Controller('health')
@ApiController({
  ...SYSTEM_HEALTH_API_CONTROLLER,
  description: 'API, DB, Redis 헬스체크',
})
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly redisHealthIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @ApiEndpoint({
    title: '헬스 체크',
    description: 'API, 데이터베이스, Redis 의존성이 정상 상태인지 확인합니다.',
    status: 200,
    response: HealthResponseDto,
    errorStatuses: [503],
    isPublic: true,
  })
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () => this.prismaHealthIndicator.pingCheck('database', this.prismaService),
      () => this.redisHealthIndicator.pingCheck('redis'),
    ]);
  }
}

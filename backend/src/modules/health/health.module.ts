import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RedisModule } from '@/infrastructure/redis/redis.module';
import { SystemMetricsCollectorService } from './application/system-metrics.collector';
import { SystemMetricsService } from './application/system-metrics.service';
import { RedisHealthIndicator } from './infrastructure/redis-health.indicator';
import { SystemMetricsStore } from './infrastructure/system-metrics.store';
import { DebugController } from './presentation/debug.controller';
import { DevOnlyGuard } from './presentation/guards/dev-only.guard';
import { HealthController } from './presentation/health.controller';
import { VersionController } from './presentation/version.controller';

@Module({
  imports: [TerminusModule, RedisModule],
  controllers: [HealthController, VersionController, DebugController],
  providers: [
    RedisHealthIndicator,
    DevOnlyGuard,
    SystemMetricsStore,
    SystemMetricsCollectorService,
    SystemMetricsService,
  ],
  exports: [SystemMetricsService],
})
export class HealthModule {}

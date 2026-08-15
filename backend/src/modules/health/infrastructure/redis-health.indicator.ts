import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { RedisService } from '@/infrastructure/redis/redis.service';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly redisService: RedisService,
  ) {}

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const response = await this.redisService.ping();

      return response === 'PONG'
        ? indicator.up()
        : indicator.down({ message: `Unexpected Redis ping response: ${response}` });
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Redis ping failed',
      });
    }
  }
}

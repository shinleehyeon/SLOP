import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRedisConnectionToken, RedisModule as IoRedisModule } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    IoRedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.getOrThrow<string>('redis.url'),
      }),
    }),
  ],
  providers: [
    {
      provide: RedisService,
      inject: [getRedisConnectionToken()],
      useFactory: (redis: Redis) => new RedisService(redis),
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}

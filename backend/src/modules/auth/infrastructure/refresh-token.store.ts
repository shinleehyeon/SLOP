import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { RedisService } from '@/infrastructure/redis/redis.service';

interface SaveRefreshTokenInput {
  userId: string;
  sessionId: string;
  refreshToken: string;
  ttlSeconds: number;
}

interface RefreshTokenSessionInput {
  userId: string;
  sessionId: string;
}

interface VerifyRefreshTokenInput extends RefreshTokenSessionInput {
  refreshToken: string;
}

@Injectable()
export class RefreshTokenStore {
  private static readonly consumeScript = `
    local stored = redis.call('GET', KEYS[1])

    if not stored then
      return 0
    end

    if stored ~= ARGV[1] then
      return 0
    end

    redis.call('DEL', KEYS[1])
    return 1
  `;

  constructor(private readonly redisService: RedisService) {}

  save(input: SaveRefreshTokenInput) {
    return this.redisService.setWithTtl(
      this.createKey(input.userId, input.sessionId),
      this.hash(input.refreshToken),
      input.ttlSeconds,
    );
  }

  async consume(input: VerifyRefreshTokenInput) {
    const result = await this.redisService.eval(
      RefreshTokenStore.consumeScript,
      [this.createKey(input.userId, input.sessionId)],
      [this.hash(input.refreshToken)],
    );

    return result === 1;
  }

  delete(input: RefreshTokenSessionInput) {
    return this.redisService.delete(this.createKey(input.userId, input.sessionId));
  }

  async deleteAllForUser(userId: string) {
    const keys = await this.redisService.scanKeys(this.createUserSessionPattern(userId));

    return this.redisService.delete(...keys);
  }

  private createKey(userId: string, sessionId: string) {
    return `refresh:user:${userId}:session:${sessionId}`;
  }

  private createUserSessionPattern(userId: string) {
    return `refresh:user:${userId}:session:*`;
  }

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}

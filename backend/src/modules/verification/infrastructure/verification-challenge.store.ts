import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { VerificationChannel } from '@/modules/verification/verification.constants';

export interface VerificationChallengeRecord {
  userId: string;
  channel: VerificationChannel;
  targetHash: string;
  codeHash: string;
  attempts: number;
}

interface SaveChallengeInput {
  challengeId: string;
  record: VerificationChallengeRecord;
  ttlSeconds: number;
}

interface VerifyChallengeInput {
  challengeId: string;
  code: string;
  maxAttempts: number;
}

@Injectable()
export class VerificationChallengeStore {
  constructor(private readonly redisService: RedisService) {}

  save(input: SaveChallengeInput) {
    return this.redisService.setWithTtl(
      this.createChallengeKey(input.challengeId),
      JSON.stringify(input.record),
      input.ttlSeconds,
    );
  }

  async verify(input: VerifyChallengeInput) {
    const key = this.createChallengeKey(input.challengeId);
    const raw = await this.redisService.get(key);

    if (!raw) {
      return { ok: false as const, reason: 'not_found' as const };
    }

    const record = JSON.parse(raw) as VerificationChallengeRecord;

    if (record.attempts >= input.maxAttempts) {
      await this.redisService.delete(key);
      return { ok: false as const, reason: 'too_many_attempts' as const };
    }

    if (record.codeHash !== this.hash(input.code)) {
      record.attempts += 1;
      const ttl = await this.redisService.ttl(key);

      if (ttl > 0) {
        await this.redisService.setWithTtl(key, JSON.stringify(record), ttl);
      }

      return { ok: false as const, reason: 'invalid_code' as const, attempts: record.attempts };
    }

    await this.redisService.delete(key);

    return {
      ok: true as const,
      userId: record.userId,
      channel: record.channel,
    };
  }

  incrementRateLimit(targetHash: string, ttlSeconds: number) {
    const key = this.createRateLimitKey(targetHash);

    return this.redisService.eval(
      `
        local count = redis.call('INCR', KEYS[1])

        if count == 1 then
          redis.call('EXPIRE', KEYS[1], ARGV[1])
        end

        return count
      `,
      [key],
      [String(ttlSeconds)],
    );
  }

  hashTarget(target: string) {
    return this.hash(target);
  }

  hashCode(code: string) {
    return this.hash(code);
  }

  private createChallengeKey(challengeId: string) {
    return `verification:challenge:${challengeId}`;
  }

  private createRateLimitKey(targetHash: string) {
    return `verification:rate:${targetHash}`;
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}

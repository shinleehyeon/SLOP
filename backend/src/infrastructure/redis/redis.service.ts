import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(private readonly redis: Redis) {}

  get(key: string) {
    return this.redis.get(key);
  }

  set(key: string, value: string) {
    return this.redis.set(key, value);
  }

  setWithTtl(key: string, value: string, ttlSeconds: number) {
    return this.redis.set(key, value, 'EX', ttlSeconds);
  }

  delete(...keys: string[]) {
    if (keys.length === 0) {
      return Promise.resolve(0);
    }

    return this.redis.del(...keys);
  }

  async scanKeys(pattern: string) {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, batch] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');

    return keys;
  }

  exists(key: string) {
    return this.redis.exists(key);
  }

  ttl(key: string) {
    return this.redis.ttl(key);
  }

  ping() {
    return this.redis.ping();
  }

  eval(script: string, keys: string[], args: string[]) {
    return this.redis.eval(script, keys.length, ...keys, ...args);
  }

  zadd(key: string, score: number, member: string) {
    return this.redis.zadd(key, score, member);
  }

  zrangebyscore(key: string, min: number | string, max: number | string) {
    return this.redis.zrangebyscore(key, min, max, 'WITHSCORES');
  }

  expire(key: string, ttlSeconds: number) {
    return this.redis.expire(key, ttlSeconds);
  }
}

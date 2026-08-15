import { Injectable } from '@nestjs/common';
import { RedisService } from '@/infrastructure/redis/redis.service';

export interface OAuthStatePayload {
  redirectUrl: string;
}

export interface OAuthLoginCodePayload {
  user: {
    id: string;
    email: string;
    name: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

@Injectable()
export class OAuthStateStore {
  private static readonly stateTtlSeconds = 10 * 60;
  private static readonly loginCodeTtlSeconds = 60;
  private static readonly consumeScript = `
    local stored = redis.call('GET', KEYS[1])

    if not stored then
      return nil
    end

    redis.call('DEL', KEYS[1])
    return stored
  `;

  constructor(private readonly redisService: RedisService) {}

  saveState(provider: string, state: string, payload: OAuthStatePayload) {
    return this.redisService.setWithTtl(
      this.createStateKey(provider, state),
      JSON.stringify(payload),
      OAuthStateStore.stateTtlSeconds,
    );
  }

  async consumeState(provider: string, state: string) {
    const result = await this.redisService.eval(
      OAuthStateStore.consumeScript,
      [this.createStateKey(provider, state)],
      [],
    );

    if (typeof result !== 'string') {
      return null;
    }

    return JSON.parse(result) as OAuthStatePayload;
  }

  saveLoginCode(code: string, payload: OAuthLoginCodePayload) {
    return this.redisService.setWithTtl(
      this.createLoginCodeKey(code),
      JSON.stringify(payload),
      OAuthStateStore.loginCodeTtlSeconds,
    );
  }

  async consumeLoginCode(code: string) {
    const result = await this.redisService.eval(
      OAuthStateStore.consumeScript,
      [this.createLoginCodeKey(code)],
      [],
    );

    if (typeof result !== 'string') {
      return null;
    }

    return JSON.parse(result) as OAuthLoginCodePayload;
  }

  private createStateKey(provider: string, state: string) {
    return `oauth:state:${provider}:${state}`;
  }

  private createLoginCodeKey(code: string) {
    return `oauth:login-code:${code}`;
  }
}

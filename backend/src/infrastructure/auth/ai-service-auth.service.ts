import { timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { RBAC_ROLES } from '@/infrastructure/rbac/rbac.permissions';
import type { AuthenticatedUser } from '@/modules/auth/application/jwt-payload';
import {
  AI_SERVICE_API_KEY_HEADER,
  AI_SERVICE_AUTH_REQUEST_KEY,
} from './ai-service-auth.constants';

@Injectable()
export class AiServiceAuthService {
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('aiService.apiKey').trim();
  }

  tryAuthenticate(request: Request): boolean {
    const providedKey = this.readHeader(request, AI_SERVICE_API_KEY_HEADER);

    if (!providedKey) {
      return false;
    }

    if (!this.isValidApiKey(providedKey)) {
      return false;
    }

    const user: AuthenticatedUser = {
      id: '',
      role: RBAC_ROLES.user,
      roles: [RBAC_ROLES.user],
      aiService: true,
    };

    request.user = user;
    request[AI_SERVICE_AUTH_REQUEST_KEY] = true;

    return true;
  }

  isAiServiceRequest(request: Request): boolean {
    return request[AI_SERVICE_AUTH_REQUEST_KEY] === true;
  }

  private isValidApiKey(providedKey: string): boolean {
    const expected = Buffer.from(this.apiKey);
    const provided = Buffer.from(providedKey.trim());

    if (expected.length !== provided.length) {
      return false;
    }

    return timingSafeEqual(expected, provided);
  }

  private readHeader(request: Request, name: string): string | undefined {
    const value = request.headers[name];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === 'string' && item.trim().length > 0);

      return first?.trim();
    }

    return undefined;
  }
}

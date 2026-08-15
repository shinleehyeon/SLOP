import { ConfigService } from '@nestjs/config';
import { AiServiceAuthService } from '@/infrastructure/auth/ai-service-auth.service';

describe('AiServiceAuthService', () => {
  const apiKey = 'a'.repeat(32);
  const service = new AiServiceAuthService({
    getOrThrow: () => apiKey,
  } as ConfigService);

  it('authenticates with API key only', () => {
    const request = {
      headers: {
        'x-ai-api-key': apiKey,
      },
    } as Express.Request;

    expect(service.tryAuthenticate(request)).toBe(true);
    expect(request.user?.id).toBe('');
    expect(request.user?.aiService).toBe(true);
    expect(request.aiServiceAuth).toBe(true);
  });

  it('does not use x-user-id header', () => {
    const request = {
      headers: {
        'x-ai-api-key': apiKey,
        'x-user-id': 'user_123',
      },
    } as Express.Request;

    expect(service.tryAuthenticate(request)).toBe(true);
    expect(request.user?.id).toBe('');
  });

  it('rejects invalid AI service keys', () => {
    const request = {
      headers: {
        'x-ai-api-key': 'invalid-key',
      },
    } as Express.Request;

    expect(service.tryAuthenticate(request)).toBe(false);
    expect(request.user).toBeUndefined();
  });
});

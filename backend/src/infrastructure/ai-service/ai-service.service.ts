import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiServiceDuplicateCheckRequest,
  AiServiceDuplicateCheckResponse,
  AiServiceGenerateRequest,
  AiServiceGenerateShortsInput,
  AiServiceJobStatus,
  AiServiceOnboardingRequest,
  AiServiceOnboardingResponse,
  AiServiceRecommendResponse,
  AiServiceSyncOnboardingInput,
} from './ai-service.types';

const DISPATCH_TIMEOUT_MS = 10_000;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('aiService.baseUrl').replace(/\/$/, '');
  }

  /**
   * POST /v1/generate/async — Community Shorts Agent
   * Links and file public URLs are sent only via `urls` (no attachments).
   * @see https://ai.vport.dev/openapi.json
   */
  async generateShortsAsync(input: AiServiceGenerateShortsInput): Promise<string> {
    const body: AiServiceGenerateRequest = {
      content: input.content,
      urls: input.urls,
      title: input.title ?? null,
      upload_to_vport: input.uploadToVport ?? true,
      user_id: input.userId,
      onboarding: input.onboarding ?? null,
    };

    const response = await this.requestJson<AiServiceJobStatus>('POST', '/v1/generate/async', body);

    if (!response.job_id || typeof response.job_id !== 'string') {
      throw new BadGatewayException('AI service returned an invalid job_id');
    }

    return response.job_id;
  }

  /**
   * POST /v1/onboarding — sync user onboarding prefs for personalization
   * @see https://ai.vport.dev/openapi.json
   */
  async syncOnboarding(input: AiServiceSyncOnboardingInput): Promise<AiServiceOnboardingResponse> {
    const onboarding =
      typeof input.onboarding === 'string' ? input.onboarding : JSON.stringify(input.onboarding);

    if (!onboarding.trim()) {
      throw new BadGatewayException('AI onboarding payload must not be empty');
    }

    const body: AiServiceOnboardingRequest = {
      user_id: input.userId,
      onboarding,
      merge: input.merge ?? false,
    };

    return this.requestJson<AiServiceOnboardingResponse>('POST', '/v1/onboarding', body);
  }

  /**
   * GET /v1/recommend — preference-weighted random short suggestion
   * @see https://ai.vport.dev/openapi.json
   */
  async recommend(userId: string): Promise<AiServiceRecommendResponse> {
    const path = `/v1/recommend?user_id=${encodeURIComponent(userId)}`;
    const response = await this.requestJson<AiServiceRecommendResponse>('GET', path);

    if (!response.job_id || typeof response.job_id !== 'string') {
      throw new BadGatewayException('AI service returned an invalid recommend payload');
    }

    return response;
  }

  /**
   * POST /v1/duplicates/check — URL-based short duplicate / similarity check
   * @see https://ai.vport.dev/openapi.json
   */
  async checkDuplicates(url: string): Promise<AiServiceDuplicateCheckResponse> {
    const body: AiServiceDuplicateCheckRequest = { url };
    const response = await this.requestJson<AiServiceDuplicateCheckResponse>(
      'POST',
      '/v1/duplicates/check',
      body,
    );

    if (
      typeof response.duplicate !== 'boolean' ||
      typeof response.similar !== 'boolean' ||
      !Array.isArray(response.job_ids) ||
      !Array.isArray(response.matches)
    ) {
      throw new BadGatewayException('AI service returned an invalid duplicate-check payload');
    }

    return response;
  }

  private async requestJson<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DISPATCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        body: method === 'POST' ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.error(
          `AI service ${method} ${path} failed: ${response.status} ${response.statusText} ${detail}`,
        );
        throw new BadGatewayException('Failed to dispatch request to AI service');
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException('AI service request timed out');
      }

      this.logger.error(`AI service ${method} ${path} error`, error);
      throw new ServiceUnavailableException('AI service is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }
}

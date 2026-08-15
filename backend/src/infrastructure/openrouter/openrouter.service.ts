import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouter } from '@openrouter/sdk';
import {
  extractOpenRouterCitations,
  type OpenRouterWebCitation,
  readAssistantContent,
} from './openrouter.citations';
import { formatOpenRouterErrorForLog } from './openrouter.errors';
import { OPENROUTER_CHAT_MODEL } from './openrouter.models';

const OPENROUTER_CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions';

export type OpenRouterChatWithCitationsResult = {
  content: string;
  citations: OpenRouterWebCitation[];
};

@Injectable()
export class OpenRouterService implements OnModuleInit {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly client: OpenRouter;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('openrouter.apiKey').trim();

    this.client = new OpenRouter({
      apiKey: this.apiKey,
    });
  }

  onModuleInit() {
    if (!this.apiKey.startsWith('sk-or-v1-')) {
      this.logger.warn(
        'OPENROUTER_API_KEY does not look like an OpenRouter inference key (expected sk-or-v1-...). Management keys will fail with 401 User not found.',
      );
    }
  }

  async chatJson(
    system: string,
    user: string,
    options?: {
      model?: string;
      /** Perplexity 등은 json_object 미지원 — 기본은 모델별 자동 */
      jsonObject?: boolean;
    },
  ): Promise<string> {
    const model = options?.model ?? OPENROUTER_CHAT_MODEL;
    const useJsonObject = options?.jsonObject ?? supportsJsonObjectResponseFormat(model);

    try {
      const response = await this.client.chat.send({
        chatRequest: {
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          ...(useJsonObject
            ? {
                responseFormat: {
                  type: 'json_object' as const,
                },
              }
            : {}),
          stream: false,
        },
      });

      const content = response.choices[0]?.message?.content;

      if (typeof content !== 'string' || !content) {
        throw new Error('Empty LLM response');
      }

      return content;
    } catch (error) {
      this.logger.error(
        `OpenRouter chat failed model=${model} jsonObject=${useJsonObject}: ${formatOpenRouterErrorForLog(error)}`,
      );
      throw error;
    }
  }

  /**
   * Raw chat/completions so Perplexity/OpenRouter citation fields are not stripped by the SDK schema.
   * Returns assistant `content` plus web sources from annotations / citations / search_results.
   */
  async chatWithCitations(
    system: string,
    user: string,
    options?: { model?: string },
  ): Promise<OpenRouterChatWithCitationsResult> {
    const model = options?.model ?? OPENROUTER_CHAT_MODEL;

    try {
      const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sunrinthon.dev',
          'X-Title': 'Sunrinthon Backend',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          stream: false,
        }),
      });

      const bodyText = await response.text();
      let payload: unknown;

      try {
        payload = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        throw Object.assign(new Error(`OpenRouter returned non-JSON (${response.status})`), {
          statusCode: response.status,
          body: bodyText,
        });
      }

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          payload.error &&
          typeof payload.error === 'object' &&
          'message' in payload.error &&
          typeof payload.error.message === 'string'
            ? payload.error.message
            : `OpenRouter HTTP ${response.status}`;

        throw Object.assign(new Error(message), {
          statusCode: response.status,
          body: bodyText,
          error:
            payload && typeof payload === 'object'
              ? (payload as { error?: unknown }).error
              : undefined,
        });
      }

      return {
        content: readAssistantContent(payload),
        citations: extractOpenRouterCitations(payload),
      };
    } catch (error) {
      this.logger.error(
        `OpenRouter chatWithCitations failed model=${model}: ${formatOpenRouterErrorForLog(error)}`,
      );
      throw error;
    }
  }
}

function supportsJsonObjectResponseFormat(model: string) {
  // Perplexity only accepts response_format.type = json_schema | text
  return !model.startsWith('perplexity/');
}

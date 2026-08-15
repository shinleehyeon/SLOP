import {
  OpenRouterError,
  PaymentRequiredResponseError,
  UnauthorizedResponseError,
} from '@openrouter/sdk/models/errors';

type ErrorWithStatus = {
  status?: number;
  statusCode?: number;
  code?: number;
  name?: string;
  body?: string;
  error?: {
    message?: string;
    code?: number;
    metadata?: {
      raw?: string;
      provider_name?: string;
    };
  };
};

export function isOpenRouterAuthError(error: unknown): boolean {
  return error instanceof UnauthorizedResponseError || getOpenRouterStatusCode(error) === 401;
}

export function isOpenRouterNonRetryableError(error: unknown): boolean {
  const statusCode = getOpenRouterStatusCode(error);

  if (statusCode === null) {
    return false;
  }

  return statusCode === 400 || statusCode === 401 || statusCode === 402 || statusCode === 403;
}

export function getOpenRouterErrorMessage(error: unknown): string {
  const statusCode = getOpenRouterStatusCode(error);

  if (statusCode === 401) {
    return 'OpenRouter API key가 거부되었습니다. OpenRouter 대시보드에서 추론용 API Key와 크레딧을 확인해 주세요.';
  }

  if (statusCode === 402 || error instanceof PaymentRequiredResponseError) {
    return 'OpenRouter 크레딧이 부족합니다.';
  }

  if (statusCode === 403) {
    return 'OpenRouter에서 이 모델 사용이 거부되었습니다. 하드코딩된 모델 접근 권한·크레딧을 확인해 주세요.';
  }

  if (statusCode === 429) {
    return 'OpenRouter rate limit에 걸렸습니다. 잠시 후 다시 시도해 주세요.';
  }

  const detail = getOpenRouterProviderDetail(error);

  if (error instanceof OpenRouterError) {
    return detail
      ? `OpenRouter 요청 실패 (${error.statusCode}): ${error.message} — ${detail}`
      : `OpenRouter 요청 실패 (${error.statusCode}): ${error.message}`;
  }

  const nestedMessage = getNestedErrorMessage(error);
  if (nestedMessage) {
    return detail ? `${nestedMessage} — ${detail}` : nestedMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'OpenRouter 요청에 실패했습니다.';
}

/** Nest/pino가 Error 객체를 비워 로그하는 경우용 문자열 */
export function formatOpenRouterErrorForLog(error: unknown): string {
  const statusCode = getOpenRouterStatusCode(error);
  const message = getOpenRouterErrorMessage(error);
  const body = error instanceof OpenRouterError ? error.body : getErrorBody(error);
  const detail = getOpenRouterProviderDetail(error);

  return [
    statusCode !== null ? `status=${statusCode}` : null,
    `message=${message}`,
    detail ? `providerDetail=${detail}` : null,
    body ? `body=${body.slice(0, 1000)}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
}

function getOpenRouterStatusCode(error: unknown): number | null {
  if (error instanceof OpenRouterError) {
    return error.statusCode;
  }

  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const candidate = error as ErrorWithStatus;

  if (typeof candidate.statusCode === 'number') {
    return candidate.statusCode;
  }

  if (typeof candidate.status === 'number') {
    return candidate.status;
  }

  if (typeof candidate.code === 'number' && candidate.code >= 400 && candidate.code < 600) {
    return candidate.code;
  }

  if (typeof candidate.error?.code === 'number') {
    return candidate.error.code;
  }

  if (candidate.name === 'UnauthorizedResponseError') {
    return 401;
  }

  return null;
}

function getNestedErrorMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const nested = (error as ErrorWithStatus).error?.message;
  return typeof nested === 'string' && nested.length > 0 ? nested : null;
}

function getErrorBody(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const body = (error as ErrorWithStatus).body;
  return typeof body === 'string' && body.length > 0 ? body : null;
}

function getOpenRouterProviderDetail(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const candidate = error as ErrorWithStatus;
  const raw = candidate.error?.metadata?.raw;
  const provider = candidate.error?.metadata?.provider_name;

  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    try {
      const parsed = JSON.parse(trimmed) as { error?: { message?: string } };
      const providerMessage = parsed.error?.message;
      if (typeof providerMessage === 'string' && providerMessage) {
        return provider ? `${provider}: ${providerMessage}` : providerMessage;
      }
    } catch {
      // keep raw
    }

    return provider ? `${provider}: ${trimmed.slice(0, 300)}` : trimmed.slice(0, 300);
  }

  if (error instanceof OpenRouterError && error.body) {
    try {
      const parsed = JSON.parse(error.body) as {
        error?: {
          message?: string;
          metadata?: { raw?: string; provider_name?: string };
        };
      };
      const nestedRaw = parsed.error?.metadata?.raw;
      const nestedProvider = parsed.error?.metadata?.provider_name;

      if (typeof nestedRaw === 'string' && nestedRaw.trim()) {
        try {
          const inner = JSON.parse(nestedRaw) as { error?: { message?: string } };
          if (inner.error?.message) {
            return nestedProvider
              ? `${nestedProvider}: ${inner.error.message}`
              : inner.error.message;
          }
        } catch {
          return nestedRaw.slice(0, 300);
        }
      }

      if (parsed.error?.message && parsed.error.message !== 'Provider returned error') {
        return parsed.error.message;
      }
    } catch {
      return error.body.slice(0, 300);
    }
  }

  return null;
}

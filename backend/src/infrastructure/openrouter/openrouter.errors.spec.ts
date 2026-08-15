import {
  getOpenRouterErrorMessage,
  isOpenRouterNonRetryableError,
} from '@/infrastructure/openrouter/openrouter.errors';

describe('openrouter.errors', () => {
  it('detects legacy-shaped 401 errors', () => {
    const error = {
      status: 401,
      error: {
        message: 'User not found.',
        code: 401,
      },
      code: 401,
    };

    expect(isOpenRouterNonRetryableError(error)).toBe(true);
    expect(getOpenRouterErrorMessage(error)).toContain('OpenRouter API key');
  });

  it('treats 400 provider errors as non-retryable and surfaces detail', () => {
    const error = {
      statusCode: 400,
      message: 'Provider returned error',
      error: {
        message: 'Provider returned error',
        code: 400,
        metadata: {
          provider_name: 'Perplexity',
          raw: JSON.stringify({
            error: {
              message:
                'validation failed: response_format.type must be one of "json_schema", "text"',
            },
          }),
        },
      },
    };

    expect(isOpenRouterNonRetryableError(error)).toBe(true);
    expect(getOpenRouterErrorMessage(error)).toContain('json_schema');
  });
});

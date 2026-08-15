import { DEFAULT_CORS_ORIGIN } from './defaults';

export const configuration = () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number.parseInt(process.env.PORT ?? '8000', 10),
    corsOrigins: (process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN)
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  throttle: {
    ttlSeconds: Number.parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10),
    limit: Number.parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
  docs: {
    enabled: process.env.DOCS_ENABLED !== 'false',
  },
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DATABASE_DIRECT_URL,
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '14d',
    },
  },
  oauth: {
    google: {
      enabled: process.env.GOOGLE_OAUTH_ENABLED === 'true',
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_OAUTH_CALLBACK_URL,
    },
    github: {
      enabled: process.env.GITHUB_OAUTH_ENABLED === 'true',
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_OAUTH_CALLBACK_URL,
    },
    allowedRedirectUrls: (process.env.OAUTH_ALLOWED_REDIRECT_URLS ?? '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean),
  },
  verification: {
    channel: process.env.VERIFICATION_CHANNEL ?? 'none',
    codeTtlSeconds: Number.parseInt(process.env.VERIFICATION_CODE_TTL_SECONDS ?? '300', 10),
    maxAttempts: Number.parseInt(process.env.VERIFICATION_MAX_ATTEMPTS ?? '5', 10),
    rateLimitTtlSeconds: Number.parseInt(
      process.env.VERIFICATION_RATE_LIMIT_TTL_SECONDS ?? '3600',
      10,
    ),
    rateLimitMaxAttempts: Number.parseInt(
      process.env.VERIFICATION_RATE_LIMIT_MAX_ATTEMPTS ?? '3',
      10,
    ),
    email: {
      resendApiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
    },
    sms: {
      solapiApiKey: process.env.SOLAPI_API_KEY,
      solapiApiSecret: process.env.SOLAPI_API_SECRET,
      sender: process.env.SOLAPI_SENDER,
    },
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  storage: {
    s3: {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      endpointUrl: process.env.AWS_S3_ENDPOINT_URL,
      publicUrl: process.env.AWS_S3_PUBLIC_URL,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      presignedUploadExpiresSeconds: Number.parseInt(
        process.env.S3_PRESIGNED_UPLOAD_EXPIRES_SECONDS ?? '900',
        10,
      ),
      temporaryFileExpiresHours: Number.parseInt(
        process.env.S3_TEMPORARY_FILE_EXPIRES_HOURS ?? '24',
        10,
      ),
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN?.trim() || undefined,
    enabled: Boolean(process.env.SENTRY_DSN?.trim()),
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY?.trim(),
  },
  aiService: {
    apiKey: process.env.AI_SERVICE_API_KEY?.trim(),
    baseUrl: process.env.AI_SERVICE_BASE_URL?.trim(),
  },
  meilisearch: {
    host: normalizeHttpUrl(process.env.MEILI_HOST),
    apiKey: process.env.MEILI_API_KEY?.trim(),
    indexPrefix: process.env.MEILI_INDEX_PREFIX?.trim() ?? '',
  },
});

function normalizeHttpUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return trimmed;
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

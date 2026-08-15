import * as Joi from 'joi';
import { DEFAULT_CORS_ORIGIN } from './defaults';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(8000),
  CORS_ORIGIN: Joi.string().default(DEFAULT_CORS_ORIGIN),
  THROTTLE_TTL_SECONDS: Joi.number().integer().positive().default(60),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(100),
  DOCS_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  DATABASE_DIRECT_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('14d'),

  GOOGLE_OAUTH_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  GOOGLE_OAUTH_CLIENT_ID: requiredWhenJoiTrue('GOOGLE_OAUTH_ENABLED', Joi.string()),
  GOOGLE_OAUTH_CLIENT_SECRET: requiredWhenJoiTrue('GOOGLE_OAUTH_ENABLED', Joi.string()),
  GOOGLE_OAUTH_CALLBACK_URL: requiredWhenJoiTrue(
    'GOOGLE_OAUTH_ENABLED',
    Joi.string().uri({ scheme: ['http', 'https'] }),
  ),
  GITHUB_OAUTH_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  GITHUB_OAUTH_CLIENT_ID: requiredWhenJoiTrue('GITHUB_OAUTH_ENABLED', Joi.string()),
  GITHUB_OAUTH_CLIENT_SECRET: requiredWhenJoiTrue('GITHUB_OAUTH_ENABLED', Joi.string()),
  GITHUB_OAUTH_CALLBACK_URL: requiredWhenJoiTrue(
    'GITHUB_OAUTH_ENABLED',
    Joi.string().uri({ scheme: ['http', 'https'] }),
  ),
  OAUTH_ALLOWED_REDIRECT_URLS: Joi.string().required(),

  VERIFICATION_CHANNEL: Joi.string().valid('none', 'email', 'sms').default('none'),
  VERIFICATION_CODE_TTL_SECONDS: Joi.number().integer().positive().default(300),
  VERIFICATION_MAX_ATTEMPTS: Joi.number().integer().positive().default(5),
  VERIFICATION_RATE_LIMIT_TTL_SECONDS: Joi.number().integer().positive().default(3600),
  VERIFICATION_RATE_LIMIT_MAX_ATTEMPTS: Joi.number().integer().positive().default(3),
  RESEND_API_KEY: requiredWhenVerificationChannel('email', Joi.string()),
  EMAIL_FROM: requiredWhenVerificationChannel('email', Joi.string()),
  SOLAPI_API_KEY: requiredWhenVerificationChannel('sms', Joi.string()),
  SOLAPI_API_SECRET: requiredWhenVerificationChannel('sms', Joi.string()),
  SOLAPI_SENDER: requiredWhenVerificationChannel('sms', Joi.string()),

  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),

  AWS_REGION: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_S3_ENDPOINT_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
  AWS_S3_PUBLIC_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  S3_PRESIGNED_UPLOAD_EXPIRES_SECONDS: Joi.number().integer().positive().default(900),
  S3_TEMPORARY_FILE_EXPIRES_HOURS: Joi.number().integer().positive().default(24),

  SENTRY_DSN: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .allow(''),

  OPENROUTER_API_KEY: Joi.string().required(),

  AI_SERVICE_API_KEY: Joi.string().min(32).required(),
  AI_SERVICE_BASE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),

  MEILI_HOST: Joi.string()
    .required()
    .custom((value, helpers) => {
      const trimmed = String(value).trim();
      const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

      try {
        const url = new URL(withScheme);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return helpers.error('string.uri');
        }
        return withScheme;
      } catch {
        return helpers.error('string.uri');
      }
    }),
  MEILI_API_KEY: Joi.string().required(),
  MEILI_INDEX_PREFIX: Joi.string().allow('').default(''),
}).custom((env, helpers) => {
  if (Boolean(env.AWS_ACCESS_KEY_ID) !== Boolean(env.AWS_SECRET_ACCESS_KEY)) {
    return helpers.message({
      custom: 'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be provided together',
    });
  }

  return env;
});

function requiredWhenJoiTrue(key: string, schema: Joi.StringSchema) {
  const options: Joi.WhenOptions = {
    is: true,
    otherwise: schema.optional(),
  };

  Object.defineProperty(options, 'then', {
    enumerable: true,
    value: schema.required(),
  });

  return schema.when(key, options);
}

function requiredWhenVerificationChannel(channel: 'email' | 'sms', schema: Joi.StringSchema) {
  const options: Joi.WhenOptions = {
    is: channel,
    otherwise: schema.optional(),
  };

  Object.defineProperty(options, 'then', {
    enumerable: true,
    value: schema.required(),
  });

  return schema.when('VERIFICATION_CHANNEL', options);
}

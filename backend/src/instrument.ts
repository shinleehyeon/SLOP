import 'dotenv/config';

import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
  });
}

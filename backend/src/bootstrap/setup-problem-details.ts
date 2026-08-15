import { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { HttpExceptionLoggingFilter } from '@/infrastructure/logging/http-exception-logging.filter';

export function setupProblemDetails(app: INestApplication) {
  app.useGlobalFilters(new HttpExceptionLoggingFilter(app.get(HttpAdapterHost)));
}

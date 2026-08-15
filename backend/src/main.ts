import './instrument';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { logEnabledFeatures } from './bootstrap/log-enabled-features';
import { setupCors } from './bootstrap/setup-cors';
import { setupGlobalPrefix } from './bootstrap/setup-global-prefix';
import { setupOpenApi } from './bootstrap/setup-openapi';
import { setupProblemDetails } from './bootstrap/setup-problem-details';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  setupProblemDetails(app);
  setupCors(app);
  setupGlobalPrefix(app);
  setupOpenApi(app);

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('app.port');

  await app.listen(port);

  logEnabledFeatures(configService, app.get(Logger));
}
bootstrap();

import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function setupCors(app: INestApplication) {
  const configService = app.get(ConfigService);
  const allowedOrigins = configService.getOrThrow<string[]>('app.corsOrigins');

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
}

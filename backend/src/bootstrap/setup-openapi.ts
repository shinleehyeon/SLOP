import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Request, Response } from 'express';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { getAppVersion } from '@/common/app-version';
import { getVerificationChannel } from '@/modules/verification/verification.constants';
import { applyOpenApiDocumentPatches } from './openapi-document.util';
import { applyVerificationChannelOpenApiPatches } from './verification-channel-openapi.util';

export function setupOpenApi(app: INestApplication) {
  const configService = app.get(ConfigService);
  const isProduction = configService.getOrThrow<string>('app.nodeEnv') === 'production';
  const docsEnabled = configService.getOrThrow<boolean>('docs.enabled');

  if (isProduction && !docsEnabled) {
    return;
  }

  const openApiDocument = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Sunrinthon API')
      .setDescription('Sunrinthon 12th backend API')
      .setVersion(getAppVersion())
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .build(),
  );

  const cleanedOpenApiDocument = cleanupOpenApiDoc(openApiDocument);
  applyOpenApiDocumentPatches(cleanedOpenApiDocument);
  applyVerificationChannelOpenApiPatches(cleanedOpenApiDocument, getVerificationChannel());

  app.use('/api/docs/openapi.json', (_request: Request, response: Response) => {
    response.json(cleanedOpenApiDocument);
  });

  SwaggerModule.setup('/api/docs/swagger', app, cleanedOpenApiDocument, {
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3/themes/3.x/theme-monokai.css',
  });

  app.use(
    '/api/docs/scalar',
    apiReference({
      theme: 'laserwave',
      url: '/api/docs/openapi.json',
    }),
  );
}

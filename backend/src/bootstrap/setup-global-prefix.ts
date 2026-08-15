import { INestApplication, RequestMethod } from '@nestjs/common';

const globalPrefixExcludedRoutes = [
  { path: 'debug/error', method: RequestMethod.GET },
  { path: 'debug/validate', method: RequestMethod.POST },
] as const;

export function setupGlobalPrefix(app: INestApplication) {
  app.setGlobalPrefix('api', {
    exclude: [...globalPrefixExcludedRoutes],
  });
}

import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

type FeatureToggle = {
  name: string;
  enabled: boolean;
};

export function logEnabledFeatures(configService: ConfigService, logger: Logger) {
  const nodeEnv = configService.getOrThrow<string>('app.nodeEnv');
  const isProduction = nodeEnv === 'production';
  const docsEnabled = !isProduction || configService.getOrThrow<boolean>('docs.enabled');

  const verificationChannel = configService.getOrThrow<string>('verification.channel');

  const features: FeatureToggle[] = [
    {
      name: `Verification (${verificationChannel})`,
      enabled: verificationChannel !== 'none',
    },
    { name: 'Google OAuth', enabled: configService.getOrThrow<boolean>('oauth.google.enabled') },
    { name: 'GitHub OAuth', enabled: configService.getOrThrow<boolean>('oauth.github.enabled') },
    { name: 'Sentry', enabled: configService.getOrThrow<boolean>('sentry.enabled') },
    { name: 'API docs', enabled: docsEnabled },
    { name: 'Debug routes', enabled: !isProduction },
  ];

  const detail = features
    .map((feature) => `    ${feature.name} · ${feature.enabled ? 'on' : 'off'}`)
    .join('\n');

  logger.log(
    {
      msg: `Runtime · ${nodeEnv}`,
      detail,
    },
    'Bootstrap',
  );
}

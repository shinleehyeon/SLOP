import { OpenAPIObject } from '@nestjs/swagger';
import { VerificationChannel } from '@/modules/verification/verification.constants';

export function applyVerificationChannelOpenApiPatches(
  document: OpenAPIObject,
  channel: VerificationChannel,
) {
  document.info.description = [
    document.info.description,
    '',
    `**Active verification channel:** \`${channel}\``,
    channel === 'none'
      ? 'Register and login use email + password.'
      : channel === 'email'
        ? 'Register sends an email OTP. Login uses email + password after verification.'
        : 'Register sends an SMS OTP. Login uses phone + password after verification.',
  ]
    .filter(Boolean)
    .join('\n');
}

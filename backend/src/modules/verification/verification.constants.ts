import { configuration } from '@/config/configuration';

export type VerificationChannel = 'none' | 'email' | 'sms';

function normalizeVerificationChannel(value: string): VerificationChannel {
  if (value === 'email' || value === 'sms') {
    return value;
  }

  return 'none';
}

export function getVerificationChannel(): VerificationChannel {
  return normalizeVerificationChannel(configuration().verification.channel);
}

export function isVerificationEnabled(): boolean {
  return getVerificationChannel() !== 'none';
}

export function isOAuthEnabledForChannel(): boolean {
  return getVerificationChannel() !== 'sms';
}

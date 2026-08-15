import { VerificationChannel } from '@/modules/verification/verification.constants';

export interface SendVerificationCodeInput {
  target: string;
  code: string;
}

export interface VerificationChannelAdapter {
  readonly type: VerificationChannel;
  normalizeTarget(raw: string): string;
  validateTarget(raw: string): void;
  sendCode(input: SendVerificationCodeInput): Promise<void>;
}

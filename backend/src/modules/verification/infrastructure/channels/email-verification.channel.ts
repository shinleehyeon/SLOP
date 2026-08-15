import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  SendVerificationCodeInput,
  VerificationChannelAdapter,
} from '@/modules/verification/application/verification-channel.interface';
import { VerificationCodeEmail } from '@/modules/verification/infrastructure/emails/verification-code-email';

@Injectable()
export class EmailVerificationChannel implements VerificationChannelAdapter {
  readonly type = 'email' as const;

  private readonly logger = new Logger(EmailVerificationChannel.name);
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('verification.email.resendApiKey'),
    );
  }

  normalizeTarget(raw: string) {
    return raw.trim().toLowerCase();
  }

  validateTarget(raw: string) {
    const normalized = this.normalizeTarget(raw);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new BadRequestException('Invalid email address');
    }
  }

  async sendCode(input: SendVerificationCodeInput) {
    const from = this.configService.getOrThrow<string>('verification.email.from');
    const { error } = await this.resend.emails.send({
      from,
      to: input.target,
      subject: 'Sunrinthon 인증번호',
      react: VerificationCodeEmail({ code: input.code }),
    });

    if (error) {
      this.logger.error(`Resend API failed: ${JSON.stringify(error)}`);
      throw new BadRequestException('Failed to send verification email');
    }
  }
}

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SolapiMessageService } from 'solapi';
import {
  SendVerificationCodeInput,
  VerificationChannelAdapter,
} from '@/modules/verification/application/verification-channel.interface';

@Injectable()
export class SmsVerificationChannel implements VerificationChannelAdapter {
  readonly type = 'sms' as const;

  private readonly logger = new Logger(SmsVerificationChannel.name);
  private readonly messageService: SolapiMessageService;

  constructor(private readonly configService: ConfigService) {
    this.messageService = new SolapiMessageService(
      this.configService.getOrThrow<string>('verification.sms.solapiApiKey'),
      this.configService.getOrThrow<string>('verification.sms.solapiApiSecret'),
    );
  }

  normalizeTarget(raw: string) {
    const digits = raw.replace(/\D/g, '');

    if (digits.startsWith('82')) {
      return `+${digits}`;
    }

    if (digits.startsWith('0')) {
      return `+82${digits.slice(1)}`;
    }

    return `+${digits}`;
  }

  validateTarget(raw: string) {
    const normalized = this.normalizeTarget(raw);
    const digits = normalized.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 15) {
      throw new BadRequestException('Invalid phone number');
    }
  }

  async sendCode(input: SendVerificationCodeInput) {
    const sender = this.configService.getOrThrow<string>('verification.sms.sender');

    try {
      await this.messageService.send({
        to: this.formatPhoneForSolapi(input.target),
        from: sender,
        text: `[Sunrinthon] 인증번호 ${input.code}`,
      });
    } catch (error) {
      this.logger.error(
        `Solapi API failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to send verification SMS');
    }
  }

  private formatPhoneForSolapi(normalizedPhone: string) {
    const digits = normalizedPhone.replace(/\D/g, '');

    if (digits.startsWith('82')) {
      return `0${digits.slice(2)}`;
    }

    return digits;
  }
}

import { DynamicModule } from '@nestjs/common';
import { registerEmailAuthChannelModule } from '@/modules/auth/channels/email/email-auth-channel.module';
import { registerPlainAuthChannelModule } from '@/modules/auth/channels/plain/plain-auth-channel.module';
import { registerSmsAuthChannelModule } from '@/modules/auth/channels/sms/sms-auth-channel.module';
import { getVerificationChannel } from '@/modules/verification/verification.constants';

export function createAuthChannelModule(): DynamicModule {
  switch (getVerificationChannel()) {
    case 'email':
      return registerEmailAuthChannelModule();
    case 'sms':
      return registerSmsAuthChannelModule();
    default:
      return registerPlainAuthChannelModule();
  }
}

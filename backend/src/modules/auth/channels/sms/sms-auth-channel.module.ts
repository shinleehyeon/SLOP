import { DynamicModule, Module } from '@nestjs/common';
import { RedisModule } from '@/infrastructure/redis/redis.module';
import { AuthRegistrationService } from '@/modules/auth/application/auth-registration.service';
import { AuthCoreModule } from '@/modules/auth/auth-core.module';
import { SmsAuthFlowController } from '@/modules/auth/channels/sms/sms-auth-flow.controller';
import { VerificationService } from '@/modules/verification/application/verification.service';
import { createVerificationProviders } from '@/modules/verification/create-verification.providers';
import { SmsVerificationChannel } from '@/modules/verification/infrastructure/channels/sms-verification.channel';

@Module({})
export class SmsAuthChannelModule {}

export function registerSmsAuthChannelModule(): DynamicModule {
  return {
    module: SmsAuthChannelModule,
    imports: [AuthCoreModule, RedisModule],
    controllers: [SmsAuthFlowController],
    providers: [AuthRegistrationService, ...createVerificationProviders(SmsVerificationChannel)],
    exports: [VerificationService],
  };
}

import { DynamicModule, Module } from '@nestjs/common';
import { RedisModule } from '@/infrastructure/redis/redis.module';
import { AuthRegistrationService } from '@/modules/auth/application/auth-registration.service';
import { AuthCoreModule } from '@/modules/auth/auth-core.module';
import { EmailAuthFlowController } from '@/modules/auth/channels/email/email-auth-flow.controller';
import { VerificationService } from '@/modules/verification/application/verification.service';
import { createVerificationProviders } from '@/modules/verification/create-verification.providers';
import { EmailVerificationChannel } from '@/modules/verification/infrastructure/channels/email-verification.channel';

@Module({})
export class EmailAuthChannelModule {}

export function registerEmailAuthChannelModule(): DynamicModule {
  return {
    module: EmailAuthChannelModule,
    imports: [AuthCoreModule, RedisModule],
    controllers: [EmailAuthFlowController],
    providers: [AuthRegistrationService, ...createVerificationProviders(EmailVerificationChannel)],
    exports: [VerificationService],
  };
}

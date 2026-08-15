import { Module } from '@nestjs/common';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { OnboardingService } from './application/onboarding.service';
import { OnboardingRepository } from './infrastructure/onboarding.repository';
import { OnboardingController } from './presentation/onboarding.controller';

@Module({
  imports: [AuditLogModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingRepository],
  exports: [OnboardingService],
})
export class OnboardingModule {}

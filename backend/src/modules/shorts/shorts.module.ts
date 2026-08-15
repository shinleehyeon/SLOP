import { Module } from '@nestjs/common';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { FilesModule } from '@/modules/files/files.module';
import { OnboardingModule } from '@/modules/onboarding/onboarding.module';
import { ShortsService } from './application/shorts.service';
import { ShortsRepository } from './infrastructure/shorts.repository';
import { ShortsController } from './presentation/shorts.controller';

@Module({
  imports: [FilesModule, AuditLogModule, OnboardingModule],
  controllers: [ShortsController],
  providers: [ShortsService, ShortsRepository],
})
export class ShortsModule {}

import { Module } from '@nestjs/common';
import { OpenRouterModule } from '@/infrastructure/openrouter/openrouter.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { ExpressionsModule } from '@/modules/expressions/expressions.module';
import { OnboardingModule } from '@/modules/onboarding/onboarding.module';
import { TextSummariesService } from './application/text-summaries.service';
import { TextSummariesController } from './presentation/text-summaries.controller';

@Module({
  imports: [OnboardingModule, OpenRouterModule, ExpressionsModule, AuditLogModule],
  controllers: [TextSummariesController],
  providers: [TextSummariesService],
})
export class TextSummariesModule {}

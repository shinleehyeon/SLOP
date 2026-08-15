import { Module } from '@nestjs/common';
import { OpenRouterModule } from '@/infrastructure/openrouter/openrouter.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { FieldsService } from './application/fields.service';
import { FieldsRepository } from './infrastructure/fields.repository';
import { FieldsController } from './presentation/fields.controller';

@Module({
  imports: [OpenRouterModule, AuditLogModule],
  controllers: [FieldsController],
  providers: [FieldsService, FieldsRepository],
})
export class FieldsModule {}

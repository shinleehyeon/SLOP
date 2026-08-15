import { Module } from '@nestjs/common';
import { ExpressionsModule } from '@/modules/expressions/expressions.module';
import { FilesModule } from '@/modules/files/files.module';
import { LearningService } from './application/learning.service';
import { LearningController } from './presentation/learning.controller';

@Module({
  imports: [ExpressionsModule, FilesModule],
  controllers: [LearningController],
  providers: [LearningService],
})
export class LearningModule {}

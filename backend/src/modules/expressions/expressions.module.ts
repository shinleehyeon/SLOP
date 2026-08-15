import { Module } from '@nestjs/common';
import { ExpressionsService } from './application/expressions.service';
import { ExpressionsRepository } from './infrastructure/expressions.repository';

@Module({
  providers: [ExpressionsService, ExpressionsRepository],
  exports: [ExpressionsService, ExpressionsRepository],
})
export class ExpressionsModule {}

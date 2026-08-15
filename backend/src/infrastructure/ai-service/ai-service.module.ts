import { Global, Module } from '@nestjs/common';
import { AiService } from './ai-service.service';

@Global()
@Module({
  providers: [AiService],
  exports: [AiService],
})
export class AiServiceModule {}

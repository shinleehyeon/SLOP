import { Global, Module } from '@nestjs/common';
import { AiServiceAuthService } from './ai-service-auth.service';

@Global()
@Module({
  providers: [AiServiceAuthService],
  exports: [AiServiceAuthService],
})
export class AiServiceAuthModule {}

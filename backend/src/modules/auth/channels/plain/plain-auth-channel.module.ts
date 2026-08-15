import { DynamicModule, Module } from '@nestjs/common';
import { AuthCoreModule } from '@/modules/auth/auth-core.module';
import { PlainAuthFlowController } from '@/modules/auth/channels/plain/plain-auth-flow.controller';

@Module({})
export class PlainAuthChannelModule {}

export function registerPlainAuthChannelModule(): DynamicModule {
  return {
    module: PlainAuthChannelModule,
    imports: [AuthCoreModule],
    controllers: [PlainAuthFlowController],
  };
}

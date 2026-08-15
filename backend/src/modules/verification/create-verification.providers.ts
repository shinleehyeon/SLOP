import type { Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerificationService } from '@/modules/verification/application/verification.service';
import { VerificationChannelAdapter } from '@/modules/verification/application/verification-channel.interface';
import { VerificationChallengeStore } from '@/modules/verification/infrastructure/verification-challenge.store';

export function createVerificationProviders(channelProvider: Type<VerificationChannelAdapter>) {
  return [
    VerificationChallengeStore,
    channelProvider,
    {
      provide: VerificationService,
      inject: [ConfigService, VerificationChallengeStore, channelProvider],
      useFactory: (
        configService: ConfigService,
        challengeStore: VerificationChallengeStore,
        adapter: VerificationChannelAdapter,
      ) => new VerificationService(configService, challengeStore, adapter),
    },
  ];
}

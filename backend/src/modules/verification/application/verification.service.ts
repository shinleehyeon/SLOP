import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createId } from '@paralleldrive/cuid2';
import {
  SendVerificationCodeInput,
  VerificationChannelAdapter,
} from '@/modules/verification/application/verification-channel.interface';
import { VerificationChallengeStore } from '@/modules/verification/infrastructure/verification-challenge.store';
import { VerificationChannel } from '@/modules/verification/verification.constants';

export interface CreateVerificationChallengeInput {
  userId: string;
  target: string;
}

export interface CreateVerificationChallengeResult {
  challengeId: string;
  expiresIn: number;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly challengeStore: VerificationChallengeStore,
    private readonly channel: VerificationChannelAdapter,
  ) {}

  get channelType(): VerificationChannel {
    return this.channel.type;
  }

  normalizeTarget(raw: string) {
    return this.channel.normalizeTarget(raw);
  }

  validateTarget(raw: string) {
    this.channel.validateTarget(raw);
  }

  async createChallenge(
    input: CreateVerificationChallengeInput,
  ): Promise<CreateVerificationChallengeResult> {
    const target = this.channel.normalizeTarget(input.target);
    this.channel.validateTarget(input.target);

    const targetHash = this.challengeStore.hashTarget(target);
    const rateLimitCount = Number(
      await this.challengeStore.incrementRateLimit(targetHash, this.getRateLimitTtlSeconds()),
    );

    if (rateLimitCount > this.getRateLimitMaxAttempts()) {
      throw new HttpException('Too many verification requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = String(randomInt(100_000, 1_000_000));
    const challengeId = createId();
    const ttlSeconds = this.getCodeTtlSeconds();

    await this.challengeStore.save({
      challengeId,
      ttlSeconds,
      record: {
        userId: input.userId,
        channel: this.channel.type,
        targetHash,
        codeHash: this.challengeStore.hashCode(code),
        attempts: 0,
      },
    });

    void this.dispatchCode({ target, code, challengeId });

    return {
      challengeId,
      expiresIn: ttlSeconds,
    };
  }

  private dispatchCode(input: SendVerificationCodeInput & { challengeId: string }) {
    this.channel.sendCode({ target: input.target, code: input.code }).catch((error: unknown) => {
      this.logger.error(
        `Failed to send ${this.channel.type} verification code for challenge ${input.challengeId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });
  }

  async verifyChallenge(challengeId: string, code: string) {
    const result = await this.challengeStore.verify({
      challengeId,
      code,
      maxAttempts: this.getMaxAttempts(),
    });

    if (!result.ok) {
      if (result.reason === 'not_found') {
        throw new NotFoundException('Verification challenge not found or expired');
      }

      if (result.reason === 'too_many_attempts') {
        throw new ForbiddenException('Too many invalid verification attempts');
      }

      throw new BadRequestException('Invalid verification code');
    }

    return {
      userId: result.userId,
      channel: result.channel,
    };
  }

  async resendForUser(input: CreateVerificationChallengeInput) {
    return this.createChallenge(input);
  }

  private getCodeTtlSeconds() {
    return this.configService.getOrThrow<number>('verification.codeTtlSeconds');
  }

  private getMaxAttempts() {
    return this.configService.getOrThrow<number>('verification.maxAttempts');
  }

  private getRateLimitTtlSeconds() {
    return this.configService.getOrThrow<number>('verification.rateLimitTtlSeconds');
  }

  private getRateLimitMaxAttempts() {
    return this.configService.getOrThrow<number>('verification.rateLimitMaxAttempts');
  }
}

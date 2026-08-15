import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { FilePurpose } from '@/generated/prisma/client';
import { SearchIndexerService } from '@/infrastructure/meilisearch/search-indexer.service';
import { AUDIT_LOG_ACTIONS } from '@/modules/audit-log/application/audit-log.actions';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { EmailRegisterRequestDto } from '@/modules/auth/presentation/dto/email-register.dto';
import { SmsRegisterRequestDto } from '@/modules/auth/presentation/dto/sms-register.dto';
import { FileDirectory } from '@/modules/files/application/file-directory.enum';
import { FilesService } from '@/modules/files/application/files.service';
import { UsersRepository } from '@/modules/users/infrastructure/users.repository';
import { VerificationService } from '@/modules/verification/application/verification.service';
import { AuthService, LocalAuthenticatedUser } from './auth.service';
import { createSmsPlaceholderEmail } from './sms-user-email.util';
import { toRbacRole } from './user-role.mapper';

@Injectable()
export class AuthRegistrationService {
  private static readonly passwordSaltRounds = 12;

  private readonly logger = new Logger(AuthRegistrationService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersRepository: UsersRepository,
    private readonly filesService: FilesService,
    private readonly auditLogService: AuditLogService,
    private readonly searchIndexer: SearchIndexerService,
    @Optional() private readonly verificationService?: VerificationService,
  ) {}

  async registerWithEmail(dto: EmailRegisterRequestDto) {
    this.assertVerificationEnabled();

    const email = this.verificationService?.normalizeTarget(dto.email) ?? dto.email;
    this.verificationService?.validateTarget(email);

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      AuthRegistrationService.passwordSaltRounds,
    );
    const user = await this.usersRepository.create({
      email,
      name: dto.name,
      passwordHash,
    });

    try {
      await this.attachProfileImageIfProvided(user.id, dto.profileImageId, dto.uploadToken);

      const challenge = await this.verificationService?.createChallenge({
        userId: user.id,
        target: email,
      });

      if (!challenge) {
        throw new BadRequestException('Verification is not configured');
      }

      this.auditLogService.record({
        action: AUDIT_LOG_ACTIONS.authRegister,
        actorId: user.id,
        targetType: 'user',
        targetId: user.id,
        metadata: {
          verificationChannel: 'email',
          profileImageAttached: Boolean(dto.profileImageId && dto.uploadToken),
        },
      });

      this.searchIndexer.indexAccountById(user.id);

      return {
        userId: user.id,
        challengeId: challenge.challengeId,
        expiresIn: challenge.expiresIn,
        requiresVerification: true as const,
      };
    } catch (error) {
      await this.usersRepository.deleteById(user.id).catch(() => undefined);
      throw error;
    }
  }

  async registerWithSms(dto: SmsRegisterRequestDto) {
    this.assertVerificationEnabled();

    const phone = this.verificationService?.normalizeTarget(dto.phone) ?? dto.phone;
    this.verificationService?.validateTarget(dto.phone);

    const existingUser = await this.usersRepository.findByPhone(phone);

    if (existingUser) {
      throw new ConflictException('Phone number is already registered');
    }

    const email = createSmsPlaceholderEmail(phone);
    const passwordHash = await bcrypt.hash(
      dto.password,
      AuthRegistrationService.passwordSaltRounds,
    );
    const user = await this.usersRepository.create({
      email,
      phone,
      name: dto.name,
      passwordHash,
    });

    try {
      await this.attachProfileImageIfProvided(user.id, dto.profileImageId, dto.uploadToken);

      const challenge = await this.verificationService?.createChallenge({
        userId: user.id,
        target: phone,
      });

      if (!challenge) {
        throw new BadRequestException('Verification is not configured');
      }

      this.auditLogService.record({
        action: AUDIT_LOG_ACTIONS.authRegister,
        actorId: user.id,
        targetType: 'user',
        targetId: user.id,
        metadata: {
          verificationChannel: 'sms',
          profileImageAttached: Boolean(dto.profileImageId && dto.uploadToken),
        },
      });

      this.searchIndexer.indexAccountById(user.id);

      return {
        userId: user.id,
        challengeId: challenge.challengeId,
        expiresIn: challenge.expiresIn,
        requiresVerification: true as const,
      };
    } catch (error) {
      await this.usersRepository.deleteById(user.id).catch(() => undefined);
      throw error;
    }
  }

  async verifyRegistration(challengeId: string, code: string) {
    this.assertVerificationEnabled();

    const verification = await this.verificationService?.verifyChallenge(challengeId, code);

    if (!verification) {
      throw new BadRequestException('Verification is not configured');
    }

    const user = await this.usersRepository.findById(verification.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (verification.channel === 'email') {
      if (user.emailVerifiedAt) {
        throw new BadRequestException('Email is already verified');
      }

      await this.usersRepository.markEmailVerified(user.id);
    }

    if (verification.channel === 'sms') {
      if (user.phoneVerifiedAt) {
        throw new BadRequestException('Phone number is already verified');
      }

      await this.usersRepository.markPhoneVerified(user.id);
    }

    const authenticatedUser = this.toLocalAuthenticatedUser(user);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.authVerificationCompleted,
      actorId: user.id,
      targetType: 'user',
      targetId: user.id,
      metadata: {
        verificationChannel: verification.channel,
      },
    });

    return this.authService.loginLocalUser(authenticatedUser);
  }

  async resendEmailVerification(userId: string, email: string) {
    this.assertVerificationEnabled();

    const normalizedEmail = this.verificationService?.normalizeTarget(email) ?? email;
    const user = await this.usersRepository.findById(userId);

    if (!user || user.email !== normalizedEmail) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email is already verified');
    }

    return this.verificationService?.resendForUser({
      userId: user.id,
      target: normalizedEmail,
    });
  }

  async resendSmsVerification(userId: string, phone: string) {
    this.assertVerificationEnabled();

    const normalizedPhone = this.verificationService?.normalizeTarget(phone) ?? phone;
    const user = await this.usersRepository.findById(userId);

    if (!user || user.phone !== normalizedPhone) {
      throw new NotFoundException('User not found');
    }

    if (user.phoneVerifiedAt) {
      throw new BadRequestException('Phone number is already verified');
    }

    return this.verificationService?.resendForUser({
      userId: user.id,
      target: normalizedPhone,
    });
  }

  private assertVerificationEnabled() {
    if (!this.verificationService) {
      throw new ForbiddenException('Verification is disabled');
    }
  }

  private async attachProfileImageIfProvided(
    userId: string,
    profileImageId?: string | null,
    uploadToken?: string | null,
  ) {
    if (!profileImageId || !uploadToken) {
      return;
    }

    let attachedProfileImageId: string | undefined;

    try {
      const profileImage = await this.filesService.attachAnonymousFile({
        fileId: profileImageId,
        uploadToken,
        ownerId: userId,
        expectedPurpose: FilePurpose.PROFILE_IMAGE,
        destinationDirectory: FileDirectory.PROFILE_IMAGE,
      });

      attachedProfileImageId = profileImage.id;
      await this.usersRepository.updateProfileImage(userId, profileImage.id);
    } catch (error) {
      if (attachedProfileImageId) {
        await this.filesService.deleteOwnedFile(attachedProfileImageId, userId).catch(() => {
          this.logger.warn(
            `Failed to rollback attached profile image ${attachedProfileImageId} for user ${userId}`,
          );
        });
      }

      throw error;
    }
  }

  private toLocalAuthenticatedUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    profileImageId: string | null;
  }): LocalAuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: toRbacRole(user.role),
      profileImageId: user.profileImageId,
    };
  }
}

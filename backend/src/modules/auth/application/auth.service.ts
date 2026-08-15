import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { createId } from '@paralleldrive/cuid2';
import * as bcrypt from 'bcrypt';
import { FilePurpose } from '@/generated/prisma/client';
import { SearchIndexerService } from '@/infrastructure/meilisearch/search-indexer.service';
import { AUDIT_LOG_ACTIONS } from '@/modules/audit-log/application/audit-log.actions';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { FileDirectory } from '@/modules/files/application/file-directory.enum';
import { FilesService } from '@/modules/files/application/files.service';
import { UsersRepository } from '@/modules/users/infrastructure/users.repository';
import { VerificationChannel } from '@/modules/verification/verification.constants';
import { RefreshTokenStore } from '../infrastructure/refresh-token.store';
import { ChangePasswordRequestDto } from '../presentation/dto/change-password.dto';
import { LoginRequestDto } from '../presentation/dto/login.dto';
import { RefreshTokenRequestDto } from '../presentation/dto/refresh-token.dto';
import { RegisterRequestDto } from '../presentation/dto/register.dto';
import { JwtPayload } from './jwt-payload';
import { toRbacRole } from './user-role.mapper';

type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

export interface LocalAuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImageId: string | null;
}

@Injectable()
export class AuthService {
  private static readonly passwordSaltRounds = 12;

  private readonly logger = new Logger(AuthService.name);

  private readonly jwtService: JwtService;
  private readonly configService: ConfigService;
  private readonly filesService: FilesService;
  private readonly usersRepository: UsersRepository;
  private readonly refreshTokenStore: RefreshTokenStore;
  private readonly auditLogService: AuditLogService;
  private readonly searchIndexer: SearchIndexerService;

  constructor(
    jwtService: JwtService,
    configService: ConfigService,
    filesService: FilesService,
    usersRepository: UsersRepository,
    refreshTokenStore: RefreshTokenStore,
    auditLogService: AuditLogService,
    searchIndexer: SearchIndexerService,
  ) {
    this.jwtService = jwtService;
    this.configService = configService;
    this.filesService = filesService;
    this.usersRepository = usersRepository;
    this.refreshTokenStore = refreshTokenStore;
    this.auditLogService = auditLogService;
    this.searchIndexer = searchIndexer;
  }

  async register(dto: RegisterRequestDto) {
    const existingUser = await this.usersRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, AuthService.passwordSaltRounds);
    const user = await this.usersRepository.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      emailVerifiedAt: new Date(),
    });

    if (dto.profileImageId && dto.uploadToken) {
      let attachedProfileImageId: string | undefined;

      try {
        const profileImage = await this.filesService.attachAnonymousFile({
          fileId: dto.profileImageId,
          uploadToken: dto.uploadToken,
          ownerId: user.id,
          expectedPurpose: FilePurpose.PROFILE_IMAGE,
          destinationDirectory: FileDirectory.PROFILE_IMAGE,
        });

        attachedProfileImageId = profileImage.id;
        await this.usersRepository.updateProfileImage(user.id, profileImage.id);
      } catch (error) {
        if (attachedProfileImageId) {
          await this.filesService.deleteOwnedFile(attachedProfileImageId, user.id).catch(() => {
            this.logger.warn(
              `Failed to rollback attached profile image ${attachedProfileImageId} for user ${user.id}`,
            );
          });
        }

        await this.usersRepository.deleteById(user.id).catch(() => undefined);
        throw error;
      }
    }

    const tokens = await this.issueTokens({
      email: user.email,
      role: user.role,
      sub: user.id,
    });

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.authRegister,
      actorId: user.id,
      targetType: 'user',
      targetId: user.id,
      metadata: {
        profileImageAttached: Boolean(dto.profileImageId && dto.uploadToken),
      },
    });

    this.searchIndexer.indexAccountById(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: toRbacRole(user.role),
        profileImageId: dto.profileImageId ?? null,
      },
      tokens,
    };
  }

  async login(dto: LoginRequestDto) {
    const user = await this.validateLocalUser(dto.email, dto.password);

    return this.loginLocalUser(user);
  }

  async validateLocalUser(email: string, password: string): Promise<LocalAuthenticatedUser> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.assertLocalUserVerified(user);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: toRbacRole(user.role),
      profileImageId: user.profileImageId,
    };
  }

  async validateLocalUserByPhone(phone: string, password: string): Promise<LocalAuthenticatedUser> {
    const normalizedPhone = this.normalizePhone(phone);
    const user = await this.usersRepository.findByPhone(normalizedPhone);

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    this.assertLocalUserVerified(user);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: toRbacRole(user.role),
      profileImageId: user.profileImageId,
    };
  }

  async loginLocalUser(user: LocalAuthenticatedUser) {
    const tokens = await this.issueTokens({
      email: user.email,
      role: user.role,
      sub: user.id,
    });

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.authLogin,
      actorId: user.id,
      targetType: 'user',
      targetId: user.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImageId: user.profileImageId,
      },
      tokens,
    };
  }

  async refresh(dto: RefreshTokenRequestDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    if (!payload.sid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await this.refreshTokenStore.consume({
      refreshToken: dto.refreshToken,
      sessionId: payload.sid,
      userId: payload.sub,
    });

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokens({
      email: user.email,
      role: user.role,
      sub: user.id,
    });

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.authRefresh,
      actorId: user.id,
      targetType: 'session',
      targetId: payload.sid,
    });

    return {
      tokens,
    };
  }

  async logout(dto: RefreshTokenRequestDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    if (!payload.sid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokenStore.delete({
      sessionId: payload.sid,
      userId: payload.sub,
    });

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.authLogout,
      actorId: payload.sub,
      targetType: 'session',
      targetId: payload.sid,
    });

    return {
      success: true,
    };
  }

  async logoutAll(userId: string) {
    await this.refreshTokenStore.deleteAllForUser(userId);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.authLogoutAll,
      actorId: userId,
      targetType: 'user',
      targetId: userId,
    });

    return {
      success: true,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordRequestDto) {
    const user = await this.usersRepository.findById(userId);

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Password change is not available for this account');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, AuthService.passwordSaltRounds);
    await this.usersRepository.updatePassword(userId, passwordHash);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.authPasswordChanged,
      actorId: userId,
      targetType: 'user',
      targetId: userId,
    });

    return {
      success: true,
    };
  }

  async setPassword(userId: string, newPassword: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid user session');
    }

    if (user.passwordHash) {
      throw new BadRequestException('Password is already set. Use password change instead.');
    }

    const passwordHash = await bcrypt.hash(newPassword, AuthService.passwordSaltRounds);
    await this.usersRepository.updatePassword(userId, passwordHash);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.authPasswordChanged,
      actorId: userId,
      targetType: 'user',
      targetId: userId,
      metadata: {
        initialSet: true,
      },
    });

    return {
      success: true,
    };
  }

  async adminResetPassword(userId: string, newPassword: string, actorId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, AuthService.passwordSaltRounds);
    await this.usersRepository.updatePassword(userId, passwordHash);
    await this.refreshTokenStore.deleteAllForUser(userId);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.userAdminPasswordReset,
      actorId,
      targetType: 'user',
      targetId: userId,
    });

    return {
      success: true,
    };
  }

  async forceLogoutUser(userId: string, actorId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.refreshTokenStore.deleteAllForUser(userId);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.userForceLogout,
      actorId,
      targetType: 'user',
      targetId: userId,
    });

    return {
      success: true,
    };
  }

  signAccessToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow<JwtExpiresIn>('jwt.access.expiresIn'),
      secret: this.configService.getOrThrow<string>('jwt.access.secret'),
    });
  }

  signRefreshToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow<JwtExpiresIn>('jwt.refresh.expiresIn'),
      secret: this.configService.getOrThrow<string>('jwt.refresh.secret'),
    });
  }

  async issueTokens(payload: JwtPayload) {
    const sessionId = createId();
    const refreshPayload = {
      ...payload,
      sid: sessionId,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(refreshPayload),
    ]);

    await this.refreshTokenStore.save({
      userId: payload.sub,
      sessionId,
      refreshToken,
      ttlSeconds: this.getRefreshTokenTtlSeconds(),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refresh.secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private parseDurationToSeconds(value: string) {
    const match = value.match(/^(\d+)([smhd])$/);

    if (!match) {
      return Number.parseInt(value, 10);
    }

    const amount = Number.parseInt(match[1], 10);
    const unit = match[2];

    if (unit === 's') {
      return amount;
    }

    if (unit === 'm') {
      return amount * 60;
    }

    if (unit === 'h') {
      return amount * 60 * 60;
    }

    return amount * 60 * 60 * 24;
  }

  private getRefreshTokenTtlSeconds() {
    return this.parseDurationToSeconds(
      this.configService.getOrThrow<string>('jwt.refresh.expiresIn'),
    );
  }

  private assertLocalUserVerified(user: {
    emailVerifiedAt: Date | null;
    phoneVerifiedAt: Date | null;
  }) {
    const channel = this.configService.getOrThrow<VerificationChannel>('verification.channel');

    if (channel === 'email' && !user.emailVerifiedAt) {
      throw new ForbiddenException('Email not verified');
    }

    if (channel === 'sms' && !user.phoneVerifiedAt) {
      throw new ForbiddenException('Phone number not verified');
    }
  }

  private normalizePhone(raw: string) {
    const digits = raw.replace(/\D/g, '');

    if (digits.startsWith('82')) {
      return `+${digits}`;
    }

    if (digits.startsWith('0')) {
      return `+82${digits.slice(1)}`;
    }

    return `+${digits}`;
  }
}

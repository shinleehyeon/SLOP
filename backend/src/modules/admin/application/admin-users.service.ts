import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { FilePurpose, OAuthProvider, UserRole } from '@/generated/prisma/client';
import { SearchIndexerService } from '@/infrastructure/meilisearch/search-indexer.service';
import { RBAC_ROLES } from '@/infrastructure/rbac/rbac.permissions';
import { AUDIT_LOG_ACTIONS } from '@/modules/audit-log/application/audit-log.actions';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { AuthService } from '@/modules/auth/application/auth.service';
import { createSmsPlaceholderEmail } from '@/modules/auth/application/sms-user-email.util';
import { toRbacRole } from '@/modules/auth/application/user-role.mapper';
import { FileDirectory } from '@/modules/files/application/file-directory.enum';
import { FilesService } from '@/modules/files/application/files.service';
import { UsersService } from '@/modules/users/application/users.service';
import { UserOAuthRepository } from '@/modules/users/infrastructure/user-oauth.repository';
import { UsersRepository } from '@/modules/users/infrastructure/users.repository';
import { ListUsersQueryDto } from '@/modules/users/presentation/dto/list-users-query.dto';
import { AdminCreateUserRequestDto } from '../presentation/dto/admin-create-user.dto';
import { AdminUpdateUserRequestDto } from '../presentation/dto/admin-update-user.dto';

type VerificationChannel = 'none' | 'email' | 'sms';

@Injectable()
export class AdminUsersService {
  private static readonly passwordSaltRounds = 12;

  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
    private readonly usersRepository: UsersRepository,
    private readonly userOAuthRepository: UserOAuthRepository,
    private readonly usersService: UsersService,
    private readonly searchIndexer: SearchIndexerService,
  ) {}

  listUsers(query: ListUsersQueryDto) {
    return this.usersService.listUsers(query);
  }

  async createUser(actorId: string, dto: AdminCreateUserRequestDto) {
    const verificationChannel =
      this.configService.getOrThrow<VerificationChannel>('verification.channel');
    const loginWith = verificationChannel === 'sms' ? 'phone' : 'email';

    if (loginWith === 'phone') {
      if (!dto.phone) {
        throw new BadRequestException('Phone number is required');
      }

      const existingPhone = await this.usersRepository.findByPhone(dto.phone);

      if (existingPhone) {
        throw new ConflictException('Phone number is already registered');
      }
    } else if (!dto.email) {
      throw new BadRequestException('Email is required');
    }

    const email =
      loginWith === 'phone' ? createSmsPlaceholderEmail(dto.phone ?? '') : (dto.email ?? '');

    if (loginWith === 'email') {
      const existingEmail = await this.usersRepository.findByEmail(email);

      if (existingEmail) {
        throw new ConflictException('Email is already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, AdminUsersService.passwordSaltRounds);

    const user = await this.usersRepository.create({
      email,
      phone: loginWith === 'phone' ? dto.phone : (dto.phone ?? null),
      name: dto.name,
      role: this.toUserRole(dto.role),
      passwordHash,
      emailVerifiedAt: this.parseVerifiedAt(dto.emailVerifiedAt),
      phoneVerifiedAt: this.parseVerifiedAt(dto.phoneVerifiedAt),
    });

    const createdUser = await this.usersRepository.findByIdWithOAuthAccounts(user.id);

    if (!createdUser) {
      throw new NotFoundException('User not found');
    }

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.userAdminCreated,
      actorId,
      targetType: 'user',
      targetId: user.id,
      metadata: {
        role: dto.role,
        loginWith,
        emailVerifiedAtSet: dto.emailVerifiedAt !== undefined && dto.emailVerifiedAt !== null,
        phoneVerifiedAtSet: dto.phoneVerifiedAt !== undefined && dto.phoneVerifiedAt !== null,
      },
    });

    this.searchIndexer.indexAccountById(user.id);

    return this.serializeAdminUser(createdUser);
  }

  async getUser(userId: string) {
    const user = await this.usersRepository.findByIdWithOAuthAccounts(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.serializeAdminUser(user);
  }

  async updateUser(actorId: string, userId: string, dto: AdminUpdateUserRequestDto) {
    const user = await this.usersRepository.findByIdWithOAuthAccounts(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(dto.email);

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email is already registered');
      }
    }

    if (dto.phone !== undefined && dto.phone !== user.phone) {
      if (dto.phone) {
        const existingUser = await this.usersRepository.findByPhone(dto.phone);

        if (existingUser && existingUser.id !== userId) {
          throw new ConflictException('Phone number is already registered');
        }
      }
    }

    if (dto.role === RBAC_ROLES.user && user.role === UserRole.ADMIN) {
      await this.assertCanModifyAdmin(userId);
    }

    const previousProfileImageId = user.profileImageId;
    let profileImageId = dto.profileImageId;

    if (dto.profileImageId === null) {
      profileImageId = null;
    } else if (dto.profileImageId && dto.profileImageId !== previousProfileImageId) {
      const profileImage = await this.filesService.attachOwnedFile({
        fileId: dto.profileImageId,
        ownerId: userId,
        expectedPurpose: FilePurpose.PROFILE_IMAGE,
        destinationDirectory: FileDirectory.PROFILE_IMAGE,
      });

      profileImageId = profileImage.id;
    }

    const updatedUser = await this.usersRepository.updateAdmin(userId, {
      name: dto.name,
      role: dto.role ? this.toUserRole(dto.role) : undefined,
      email: dto.email,
      phone: dto.phone,
      profileImageId,
    });

    if (previousProfileImageId && previousProfileImageId !== profileImageId) {
      await this.deletePreviousProfileImage(previousProfileImageId, userId);
    }

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.userAdminUpdated,
      actorId,
      targetType: 'user',
      targetId: userId,
      metadata: {
        nameUpdated: dto.name !== undefined,
        roleUpdated: dto.role !== undefined,
        emailUpdated: dto.email !== undefined,
        phoneUpdated: dto.phone !== undefined,
        profileImageUpdated: dto.profileImageId !== undefined,
      },
    });

    this.searchIndexer.indexAccountById(userId);

    return this.serializeAdminUser(updatedUser);
  }

  async deleteUser(actorId: string, userId: string) {
    const result = await this.removeUser(actorId, userId);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.userAdminDeleted,
      actorId,
      targetType: 'user',
      targetId: userId,
      metadata: {
        deletedObjectCount: result.deletedObjectCount,
      },
    });

    return {
      success: true,
    };
  }

  async deleteBulkUsers(actorId: string, userIds: string[]) {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.removeUser(actorId, userId)),
    );

    const failures: Array<{ userId: string; message: string }> = [];
    const deletedUserIds: string[] = [];
    let totalDeletedObjectCount = 0;

    results.forEach((result, index) => {
      const userId = userIds[index];

      if (!userId) {
        return;
      }

      if (result.status === 'fulfilled') {
        deletedUserIds.push(userId);
        totalDeletedObjectCount += result.value.deletedObjectCount;
        return;
      }

      failures.push({
        userId,
        message: result.reason instanceof Error ? result.reason.message : 'Operation failed',
      });
    });

    if (deletedUserIds.length > 0 || failures.length > 0) {
      this.auditLogService.record({
        action: AUDIT_LOG_ACTIONS.userAdminBulkDeleted,
        actorId,
        targetType: 'user',
        metadata: {
          deletedCount: deletedUserIds.length,
          userIds: deletedUserIds,
          totalDeletedObjectCount,
          failures,
        },
      });
    }

    return {
      deletedCount: deletedUserIds.length,
      failures,
    };
  }

  private async removeUser(actorId: string, userId: string) {
    if (actorId === userId) {
      throw new BadRequestException('Admins cannot delete their own account from the admin API');
    }

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      await this.assertCanModifyAdmin(userId);
    }

    const objectKeys = await this.filesService.getOwnedObjectKeys(userId);

    await this.authService.forceLogoutUser(userId, actorId);
    await this.searchIndexer.removeAccount(userId);
    await this.usersRepository.deleteById(userId);
    await this.filesService.deleteObjects(objectKeys);

    return {
      deletedObjectCount: objectKeys.length,
    };
  }

  async listOAuthAccounts(userId: string) {
    await this.assertUserExists(userId);

    const items = await this.userOAuthRepository.findOAuthAccountsByUserId(userId);

    return {
      items: items.map((account) => this.serializeOAuthAccount(account)),
    };
  }

  async unlinkOAuth(actorId: string, userId: string, provider: 'google' | 'github') {
    const user = await this.usersRepository.findByIdWithOAuthAccounts(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oauthProvider = this.toOAuthProvider(provider);
    const oauthAccount = user.oauthAccounts.find((account) => account.provider === oauthProvider);

    if (!oauthAccount) {
      throw new NotFoundException('OAuth account not found');
    }

    if (!user.passwordHash && user.oauthAccounts.length === 1) {
      throw new BadRequestException(
        'Cannot unlink the only sign-in method. Set a password first or link another provider.',
      );
    }

    await this.userOAuthRepository.deleteOAuthAccount(userId, oauthProvider);
    await this.authService.forceLogoutUser(userId, actorId);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.oauthUnlinked,
      actorId,
      targetType: 'user',
      targetId: userId,
      metadata: {
        provider,
      },
    });

    return {
      success: true,
    };
  }

  resetPassword(actorId: string, userId: string, newPassword: string) {
    return this.authService.adminResetPassword(userId, newPassword, actorId);
  }

  forceLogout(actorId: string, userId: string) {
    return this.authService.forceLogoutUser(userId, actorId);
  }

  private async assertUserExists(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async assertCanModifyAdmin(_userId: string) {
    const adminCount = await this.usersRepository.countByRole(UserRole.ADMIN);

    if (adminCount <= 1) {
      throw new ForbiddenException('At least one admin account must remain');
    }
  }

  private toUserRole(role: 'admin' | 'user') {
    return role === RBAC_ROLES.admin ? UserRole.ADMIN : UserRole.USER;
  }

  private parseVerifiedAt(value: string | null | undefined) {
    if (value === undefined || value === null) {
      return null;
    }

    return new Date(value);
  }

  private toOAuthProvider(provider: 'google' | 'github') {
    return provider === 'google' ? OAuthProvider.GOOGLE : OAuthProvider.GITHUB;
  }

  private serializeOAuthAccount(account: {
    id: string;
    provider: OAuthProvider;
    providerAccountId: string;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: account.id,
      provider: account.provider === OAuthProvider.GOOGLE ? 'google' : 'github',
      providerAccountId: account.providerAccountId,
      email: account.email,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    } as const;
  }

  private serializeAdminUser(user: {
    id: string;
    email: string;
    phone: string | null;
    name: string;
    role: UserRole | string;
    passwordHash: string | null;
    emailVerifiedAt: Date | null;
    phoneVerifiedAt: Date | null;
    profileImageId: string | null;
    profileImage?: { key: string } | null;
    oauthAccounts?: Array<{
      id: string;
      provider: OAuthProvider;
      providerAccountId: string;
      email: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: toRbacRole(user.role),
      profileImageId: user.profileImageId,
      profileImageUrl: user.profileImage?.key
        ? this.filesService.getPublicUrl(user.profileImage.key)
        : null,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
      hasPassword: Boolean(user.passwordHash),
      oauthAccounts: (user.oauthAccounts ?? []).map((account) =>
        this.serializeOAuthAccount(account),
      ),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async deletePreviousProfileImage(fileId: string, userId: string) {
    try {
      await this.filesService.deleteOwnedFile(fileId, userId);
    } catch (error) {
      this.logger.warn(
        `Failed to delete previous profile image ${fileId} for user ${userId}: ${this.formatError(
          error,
        )}`,
      );
    }
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}

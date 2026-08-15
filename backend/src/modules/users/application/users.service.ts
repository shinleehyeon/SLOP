import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createPaginationMeta } from '@/common/dto/pagination.dto';
import { resolveListQuery } from '@/common/list-query';
import { FilePurpose, OAuthProvider } from '@/generated/prisma/client';
import { SearchIndexerService } from '@/infrastructure/meilisearch/search-indexer.service';
import { AUDIT_LOG_ACTIONS } from '@/modules/audit-log/application/audit-log.actions';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { AuthService } from '@/modules/auth/application/auth.service';
import { toRbacRole } from '@/modules/auth/application/user-role.mapper';
import { FileDirectory } from '@/modules/files/application/file-directory.enum';
import { FilesService } from '@/modules/files/application/files.service';
import { UserOAuthRepository } from '../infrastructure/user-oauth.repository';
import { UsersRepository } from '../infrastructure/users.repository';
import {
  ListUsersQueryDto,
  USER_LIST_QUERY_CONFIG,
} from '../presentation/dto/list-users-query.dto';
import { UpdateUserRequestDto } from '../presentation/dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly filesService: FilesService,
    private readonly usersRepository: UsersRepository,
    private readonly userOAuthRepository: UserOAuthRepository,
    private readonly auditLogService: AuditLogService,
    private readonly searchIndexer: SearchIndexerService,
  ) {}

  async getMe(userId: string) {
    const user = await this.usersRepository.findByIdWithOAuthAccounts(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid user session');
    }

    return this.serializeMe(user);
  }

  async listUsers(query: ListUsersQueryDto) {
    const listQuery = resolveListQuery(query, USER_LIST_QUERY_CONFIG);
    const { items, total } = await this.usersRepository.findMany({ listQuery });

    return {
      items: items.map((user) => this.serializeListItem(user)),
      meta: createPaginationMeta({
        page: query.page,
        limit: query.limit,
        total,
      }),
    };
  }

  async updateMe(userId: string, dto: UpdateUserRequestDto) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid user session');
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

    const updatedUser = await this.usersRepository.updateProfile(userId, {
      name: dto.name,
      profileImageId,
    });

    if (previousProfileImageId && previousProfileImageId !== profileImageId) {
      await this.deletePreviousProfileImage(previousProfileImageId, userId);
    }

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.userUpdated,
      actorId: userId,
      targetType: 'user',
      targetId: userId,
      metadata: {
        nameUpdated: dto.name !== undefined,
        profileImageUpdated: dto.profileImageId !== undefined,
        profileImageRemoved: dto.profileImageId === null,
      },
    });

    this.searchIndexer.indexAccountById(userId);

    return this.serializeUser(updatedUser);
  }

  async unlinkOAuthSelf(userId: string, provider: 'google' | 'github') {
    const user = await this.usersRepository.findByIdWithOAuthAccounts(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid user session');
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
    await this.authService.forceLogoutUser(userId, userId);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.oauthUnlinked,
      actorId: userId,
      targetType: 'user',
      targetId: userId,
      metadata: {
        provider,
        self: true,
      },
    });

    return {
      success: true as const,
    };
  }

  async deleteMe(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid user session');
    }

    const objectKeys = await this.filesService.getOwnedObjectKeys(userId);

    await this.searchIndexer.removeAccount(userId);
    await this.usersRepository.deleteById(userId);
    await this.filesService.deleteObjects(objectKeys);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.userDeleted,
      actorId: userId,
      targetType: 'user',
      targetId: userId,
      metadata: {
        deletedObjectCount: objectKeys.length,
      },
    });

    return {
      success: true,
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

  private serializeUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    profileImageId: string | null;
    profileImage?: { key: string } | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: toRbacRole(user.role),
      profileImageId: user.profileImageId,
      profileImageUrl: user.profileImage?.key
        ? this.filesService.getPublicUrl(user.profileImage.key)
        : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private serializeMe(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    passwordHash: string | null;
    profileImageId: string | null;
    profileImage?: { key: string } | null;
    oauthAccounts: Array<{
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
      ...this.serializeUser(user),
      hasPassword: Boolean(user.passwordHash),
      oauthAccounts: user.oauthAccounts.map((account) => this.serializeOAuthAccount(account)),
    };
  }

  private serializeListItem(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    profileImageId: string | null;
    profileImage?: { key: string } | null;
    oauthAccounts: Array<{ provider: OAuthProvider }>;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...this.serializeUser(user),
      oauthProviders: user.oauthAccounts.map((account) =>
        account.provider === OAuthProvider.GOOGLE ? 'google' : 'github',
      ),
    };
  }
}

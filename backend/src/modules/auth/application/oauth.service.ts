import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createId } from '@paralleldrive/cuid2';
import { OAuthProvider } from '@/generated/prisma/client';
import { SearchIndexerService } from '@/infrastructure/meilisearch/search-indexer.service';
import { AUDIT_LOG_ACTIONS } from '@/modules/audit-log/application/audit-log.actions';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { FilesService } from '@/modules/files/application/files.service';
import { UserOAuthRepository } from '@/modules/users/infrastructure/user-oauth.repository';
import { UsersRepository } from '@/modules/users/infrastructure/users.repository';
import { VerificationChannel } from '@/modules/verification/verification.constants';
import { OAuthStatePayload, OAuthStateStore } from '../infrastructure/oauth-state.store';
import { AuthService } from './auth.service';
import { toRbacRole } from './user-role.mapper';

export type OAuthProviderKey = 'google' | 'github';

export interface OAuthProfile {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name: string;
  pictureUrl?: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
    private readonly oauthStateStore: OAuthStateStore,
    private readonly usersRepository: UsersRepository,
    private readonly userOAuthRepository: UserOAuthRepository,
    private readonly auditLogService: AuditLogService,
    private readonly searchIndexer: SearchIndexerService,
  ) {}

  async createState(provider: OAuthProviderKey, redirectUrl?: string) {
    this.assertOAuthProviderEnabled(provider);

    if (!redirectUrl) {
      throw new BadRequestException('OAuth redirectUrl is required');
    }

    this.assertAllowedRedirectUrl(redirectUrl);

    const state = createId();
    await this.oauthStateStore.saveState(provider, state, {
      redirectUrl,
    });

    return state;
  }

  async consumeState(provider: OAuthProviderKey, state?: string) {
    this.assertOAuthProviderEnabled(provider);

    if (!state) {
      throw new BadRequestException('OAuth state is required');
    }

    const statePayload = await this.oauthStateStore.consumeState(provider, state);

    if (!statePayload) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    return statePayload;
  }

  async completeLogin(profile: OAuthProfile, statePayload: OAuthStatePayload) {
    const authResponse = await this.issueOAuthTokens(profile);
    const loginCode = createId();
    await this.oauthStateStore.saveLoginCode(loginCode, authResponse);

    const redirectUrl = new URL(statePayload.redirectUrl);
    redirectUrl.searchParams.set('code', loginCode);

    return redirectUrl.toString();
  }

  private async issueOAuthTokens(profile: OAuthProfile) {
    const user = await this.resolveOAuthUser(profile);
    const tokens = await this.authService.issueTokens({
      email: user.email,
      role: user.role,
      sub: user.id,
    });

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.oauthLogin,
      actorId: user.id,
      targetType: 'user',
      targetId: user.id,
      metadata: {
        provider: profile.provider,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: toRbacRole(user.role),
        profileImageId: user.profileImageId,
      },
      tokens,
    };
  }

  async exchangeLoginCode(code?: string) {
    if (!code) {
      throw new BadRequestException('OAuth login code is required');
    }

    const payload = await this.oauthStateStore.consumeLoginCode(code);

    if (!payload) {
      throw new UnauthorizedException('Invalid OAuth login code');
    }

    return payload;
  }

  private assertAllowedRedirectUrl(redirectUrl: string) {
    let parsedRedirectUrl: URL;

    try {
      parsedRedirectUrl = new URL(redirectUrl);
    } catch {
      throw new BadRequestException('Invalid OAuth redirectUrl');
    }

    const allowedRedirectUrls = this.configService.getOrThrow<string[]>(
      'oauth.allowedRedirectUrls',
    );
    const isAllowed = allowedRedirectUrls.some((allowedRedirectUrl) => {
      try {
        const parsedAllowedRedirectUrl = new URL(allowedRedirectUrl);

        return parsedAllowedRedirectUrl.toString() === parsedRedirectUrl.toString();
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      throw new BadRequestException('OAuth redirectUrl is not allowed');
    }
  }

  private assertOAuthProviderEnabled(provider: OAuthProviderKey) {
    const isEnabled = this.configService.getOrThrow<boolean>(`oauth.${provider}.enabled`);

    if (!isEnabled) {
      throw new BadRequestException(`${provider} OAuth is disabled`);
    }
  }

  private async resolveOAuthUser(profile: OAuthProfile) {
    const oauthAccount = await this.userOAuthRepository.findByOAuthAccount(
      profile.provider,
      profile.providerAccountId,
    );

    if (oauthAccount) {
      this.assertOAuthLoginAllowed(oauthAccount.user);

      await this.maybeImportOAuthProfileImage(
        oauthAccount.user.id,
        profile.pictureUrl,
        profile.provider,
      );

      return (await this.usersRepository.findById(oauthAccount.user.id)) ?? oauthAccount.user;
    }

    const existingUser = await this.usersRepository.findByEmail(profile.email);

    if (existingUser) {
      this.assertOAuthLoginAllowed(existingUser);
      await this.userOAuthRepository.createOAuthAccount(existingUser.id, profile);

      await this.maybeImportOAuthProfileImage(
        existingUser.id,
        profile.pictureUrl,
        profile.provider,
      );

      return (await this.usersRepository.findById(existingUser.id)) ?? existingUser;
    }

    const createdUser = await this.userOAuthRepository.createOAuthUser(profile);

    await this.maybeImportOAuthProfileImage(createdUser.id, profile.pictureUrl, profile.provider);
    this.searchIndexer.indexAccountById(createdUser.id);

    return (await this.usersRepository.findById(createdUser.id)) ?? createdUser;
  }

  private async maybeImportOAuthProfileImage(
    userId: string,
    pictureUrl: string | undefined,
    provider: OAuthProvider,
  ) {
    if (!pictureUrl) {
      return;
    }

    const user = await this.usersRepository.findById(userId);

    if (!user?.profileImageId) {
      const profileImageId = await this.filesService.importProfileImageFromUrl(
        userId,
        pictureUrl,
        provider,
      );

      if (profileImageId) {
        await this.usersRepository.updateProfileImage(userId, profileImageId);
        this.searchIndexer.indexAccountById(userId);
      }
    }
  }

  private assertOAuthLoginAllowed(user: { emailVerifiedAt: Date | null }) {
    const channel = this.configService.getOrThrow<VerificationChannel>('verification.channel');

    if (channel === 'email' && !user.emailVerifiedAt) {
      throw new ForbiddenException('Complete email verification before signing in with OAuth');
    }
  }
}

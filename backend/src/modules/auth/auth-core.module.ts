import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { isOAuthEnabledForChannel } from '@/modules/verification/verification.constants';
import { FilesModule } from '../files/files.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './application/auth.service';
import { OAuthService } from './application/oauth.service';
import { GitHubOAuthStrategy } from './infrastructure/github-oauth.strategy';
import { GoogleOAuthStrategy } from './infrastructure/google-oauth.strategy';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { OAuthStateStore } from './infrastructure/oauth-state.store';
import { RefreshTokenStore } from './infrastructure/refresh-token.store';
import { AuthController } from './presentation/auth.controller';
import {
  GitHubOAuthCallbackGuard,
  GitHubOAuthGuard,
  GoogleOAuthCallbackGuard,
  GoogleOAuthGuard,
} from './presentation/guards/oauth.guard';
import { OAuthController } from './presentation/oauth.controller';

type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

const oauthEnabled = isOAuthEnabledForChannel();

const oauthControllers = oauthEnabled ? [OAuthController] : [];

const oauthProviders = oauthEnabled
  ? [
      OAuthService,
      GitHubOAuthCallbackGuard,
      GitHubOAuthGuard,
      GitHubOAuthStrategy,
      GoogleOAuthCallbackGuard,
      GoogleOAuthGuard,
      GoogleOAuthStrategy,
      OAuthStateStore,
    ]
  : [];

@Module({
  imports: [
    PassportModule,
    FilesModule,
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.access.secret'),
        signOptions: {
          expiresIn: configService.getOrThrow<JwtExpiresIn>('jwt.access.expiresIn'),
        },
      }),
    }),
  ],
  controllers: [AuthController, ...oauthControllers],
  providers: [AuthService, JwtStrategy, RefreshTokenStore, ...oauthProviders],
  exports: [AuthService, FilesModule, UsersModule],
})
export class AuthCoreModule {}

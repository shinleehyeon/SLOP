import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { OAuthProvider } from '@/generated/prisma/client';
import { OAuthProfile } from '../application/oauth.service';

@Injectable()
export class GitHubOAuthStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      callbackURL: configService.getOrThrow<string>('oauth.github.callbackUrl'),
      clientID: configService.getOrThrow<string>('oauth.github.clientId'),
      clientSecret: configService.getOrThrow<string>('oauth.github.clientSecret'),
      scope: ['read:user', 'user:email'],
      userAgent: 'Sunrinthon API',
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): OAuthProfile {
    const email = profile.emails?.[0]?.value;

    if (!profile.id || !email) {
      throw new UnauthorizedException('Invalid GitHub user profile');
    }

    return {
      provider: OAuthProvider.GITHUB,
      providerAccountId: profile.id,
      email,
      name: profile.displayName ?? profile.username ?? email,
      pictureUrl: profile.photos?.[0]?.value,
    };
  }
}

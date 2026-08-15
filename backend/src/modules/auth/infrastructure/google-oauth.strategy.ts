import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { OAuthProvider } from '@/generated/prisma/client';
import { OAuthProfile } from '../application/oauth.service';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      callbackURL: configService.getOrThrow<string>('oauth.google.callbackUrl'),
      clientID: configService.getOrThrow<string>('oauth.google.clientId'),
      clientSecret: configService.getOrThrow<string>('oauth.google.clientSecret'),
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): OAuthProfile {
    const email = profile.emails?.[0]?.value;

    if (!profile.id || !email) {
      throw new UnauthorizedException('Invalid Google user profile');
    }

    return {
      provider: OAuthProvider.GOOGLE,
      providerAccountId: profile.id,
      email,
      name: profile.displayName ?? email,
      pictureUrl: profile.photos?.[0]?.value,
    };
  }
}

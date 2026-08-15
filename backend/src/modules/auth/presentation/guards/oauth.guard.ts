import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { OAuthService } from '../../application/oauth.service';
import { OAuthStatePayload } from '../../infrastructure/oauth-state.store';

export interface OAuthRequest extends Request {
  oauthState?: string;
  oauthStatePayload?: OAuthStatePayload;
}

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly oauthService: OAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<OAuthRequest>();
    const redirectUrl =
      typeof request.query.redirectUrl === 'string' ? request.query.redirectUrl : undefined;

    request.oauthState = await this.oauthService.createState('google', redirectUrl);

    return super.canActivate(context) as Promise<boolean>;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<OAuthRequest>();

    return {
      accessType: 'offline',
      includeGrantedScopes: true,
      prompt: 'select_account',
      scope: ['email', 'profile'],
      session: false,
      state: request.oauthState,
    };
  }
}

@Injectable()
export class GoogleOAuthCallbackGuard extends AuthGuard('google') {
  constructor(private readonly oauthService: OAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<OAuthRequest>();
    const state = typeof request.query.state === 'string' ? request.query.state : undefined;

    request.oauthStatePayload = await this.oauthService.consumeState('google', state);

    return super.canActivate(context) as Promise<boolean>;
  }

  getAuthenticateOptions() {
    return {
      session: false,
    };
  }
}

@Injectable()
export class GitHubOAuthGuard extends AuthGuard('github') {
  constructor(private readonly oauthService: OAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<OAuthRequest>();
    const redirectUrl =
      typeof request.query.redirectUrl === 'string' ? request.query.redirectUrl : undefined;

    request.oauthState = await this.oauthService.createState('github', redirectUrl);

    return super.canActivate(context) as Promise<boolean>;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<OAuthRequest>();

    return {
      scope: ['read:user', 'user:email'],
      session: false,
      state: request.oauthState,
    };
  }
}

@Injectable()
export class GitHubOAuthCallbackGuard extends AuthGuard('github') {
  constructor(private readonly oauthService: OAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<OAuthRequest>();
    const state = typeof request.query.state === 'string' ? request.query.state : undefined;

    request.oauthStatePayload = await this.oauthService.consumeState('github', state);

    return super.canActivate(context) as Promise<boolean>;
  }

  getAuthenticateOptions() {
    return {
      session: false,
    };
  }
}

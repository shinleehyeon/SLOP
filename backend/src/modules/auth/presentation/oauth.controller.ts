import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import {
  ApiOAuthExchangeBody,
  ApiOAuthProviderCallbackQuery,
  ApiOAuthStartQuery,
} from '@/common/decorators/api-oauth-query.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { OAuthProfile, OAuthService } from '../application/oauth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { OAuthExchangeRequestDto } from './dto/oauth-exchange.dto';
import {
  GitHubOAuthCallbackGuard,
  GitHubOAuthGuard,
  GoogleOAuthCallbackGuard,
  GoogleOAuthGuard,
  OAuthRequest,
} from './guards/oauth.guard';

@Controller('oauth')
@ApiController({
  tag: OPENAPI_TAGS.oauth,
  group: OPENAPI_GROUPS.authentication,
  description: 'Google / GitHub OAuth',
})
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOAuthStartQuery()
  @ApiEndpoint({
    title: '구글 OAuth 시작',
    description:
      '허용된 `redirectUrl`을 state와 함께 저장한 뒤 Google 인증 페이지로 302 리다이렉트합니다. 브라우저에서 직접 호출하세요.',
    status: 302,
    redirect: true,
    errorStatuses: [400],
    isPublic: true,
  })
  googleOAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthCallbackGuard)
  @ApiOAuthProviderCallbackQuery()
  @ApiEndpoint({
    title: '구글 OAuth 콜백',
    description:
      'Google이 `code`·`state`와 함께 호출하는 백엔드 callback입니다. 검증 후 `redirectUrl?code=<일회용 로그인 코드>`로 302 리다이렉트합니다.',
    status: 302,
    redirect: true,
    errorStatuses: [400, 401],
    isPublic: true,
  })
  async googleOAuthCallback(@Req() request: OAuthRequest, @Res() response: Response) {
    return response.redirect(
      await this.oauthService.completeLogin(
        this.getOAuthProfileOrThrow(request),
        this.getOAuthStatePayloadOrThrow(request),
      ),
    );
  }

  @Get('github')
  @UseGuards(GitHubOAuthGuard)
  @ApiOAuthStartQuery()
  @ApiEndpoint({
    title: '깃허브 OAuth 시작',
    description:
      '허용된 `redirectUrl`을 state와 함께 저장한 뒤 GitHub 인증 페이지로 302 리다이렉트합니다. 브라우저에서 직접 호출하세요.',
    status: 302,
    redirect: true,
    errorStatuses: [400],
    isPublic: true,
  })
  githubOAuth() {}

  @Get('github/callback')
  @UseGuards(GitHubOAuthCallbackGuard)
  @ApiOAuthProviderCallbackQuery()
  @ApiEndpoint({
    title: '깃허브 OAuth 콜백',
    description:
      'GitHub이 `code`·`state`와 함께 호출하는 백엔드 callback입니다. 검증 후 `redirectUrl?code=<일회용 로그인 코드>`로 302 리다이렉트합니다.',
    status: 302,
    redirect: true,
    errorStatuses: [400, 401],
    isPublic: true,
  })
  async githubOAuthCallback(@Req() request: OAuthRequest, @Res() response: Response) {
    return response.redirect(
      await this.oauthService.completeLogin(
        this.getOAuthProfileOrThrow(request),
        this.getOAuthStatePayloadOrThrow(request),
      ),
    );
  }

  @Post('exchange')
  @ApiOAuthExchangeBody()
  @ApiEndpoint({
    title: 'OAuth 로그인 코드 교환',
    description:
      '프론트 callback 페이지가 받은 일회용 `code`를 access/refresh 토큰으로 교환합니다. OAuth 제공자 code와 혼동하지 마세요.',
    status: 200,
    response: AuthResponseDto,
    errorStatuses: [400, 401],
    isPublic: true,
  })
  exchange(@Body() dto: OAuthExchangeRequestDto) {
    return this.oauthService.exchangeLoginCode(dto.code);
  }

  private getOAuthStatePayloadOrThrow(request: OAuthRequest) {
    if (!request.oauthStatePayload) {
      throw new UnauthorizedException('OAuth state payload is missing');
    }

    return request.oauthStatePayload;
  }

  private getOAuthProfileOrThrow(request: OAuthRequest) {
    if (!request.user) {
      throw new UnauthorizedException('OAuth profile is missing');
    }

    return request.user as unknown as OAuthProfile;
  }
}

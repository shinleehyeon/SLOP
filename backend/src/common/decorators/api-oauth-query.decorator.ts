import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { OAuthExchangeRequestDto } from '@/modules/auth/presentation/dto/oauth-exchange.dto';

export function ApiOAuthStartQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'redirectUrl',
      required: true,
      description:
        'OAuth 완료 후 프론트로 돌아갈 URL. `OAUTH_ALLOWED_REDIRECT_URLS`에 등록된 origin/path만 허용됩니다.',
    }),
  );
}

export function ApiOAuthProviderCallbackQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'code',
      required: true,
      description: 'OAuth 제공자(Google/GitHub)가 발급한 authorization code',
      example: '7f31e18d8fa6d69ebc2a',
    }),
    ApiQuery({
      name: 'state',
      required: true,
      description: 'OAuth 시작 시 서버가 발급·Redis에 저장한 state (CSRF 방지)',
      example: 'uds1hcolln62j51fcmmx2d1b',
    }),
    ApiQuery({
      name: 'error',
      required: false,
      description: 'OAuth 제공자가 사용자 취소 등으로 실패한 경우 전달되는 에러 코드',
      example: 'access_denied',
    }),
  );
}

export function ApiOAuthExchangeBody() {
  return applyDecorators(
    ApiBody({
      type: OAuthExchangeRequestDto,
      description:
        '프론트 callback URL의 `code` 쿼리 파라미터 값(일회용 로그인 코드). access/refresh 토큰으로 교환합니다.',
    }),
  );
}

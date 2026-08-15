import { SetMetadata } from '@nestjs/common';

export const ALLOW_AI_SERVICE_AUTH_KEY = 'allowAiServiceAuth';

/** AI 마이크로서비스 API Key로 이 엔드포인트 인증을 허용합니다. */
export const AllowAiServiceAuth = () => SetMetadata(ALLOW_AI_SERVICE_AUTH_KEY, true);

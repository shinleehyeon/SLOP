import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser, CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { AUTH_API_CONTROLLER } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import {
  isOAuthEnabledForChannel,
  VerificationChannel,
} from '@/modules/verification/verification.constants';
import { AuthService } from '../application/auth.service';
import { AuthCapabilitiesResponseDto } from './dto/auth-capabilities.dto';
import {
  AuthSessionResponseDto,
  AuthTokenResponseDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';
import { ChangePasswordRequestDto } from './dto/change-password.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token.dto';
import { SetPasswordRequestDto } from './dto/set-password.dto';

@Controller('auth')
@ApiController({ ...AUTH_API_CONTROLLER })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('capabilities')
  @ApiEndpoint({
    title: '인증 기능 조회',
    description:
      '현재 배포의 verification 채널, OAuth 사용 가능 여부, 로그인/회원가입 방식을 반환합니다.',
    status: 200,
    response: AuthCapabilitiesResponseDto,
    isPublic: true,
  })
  capabilities() {
    const verificationChannel =
      this.configService.getOrThrow<VerificationChannel>('verification.channel');

    return {
      verificationChannel,
      oauthEnabled: isOAuthEnabledForChannel(),
      loginWith: verificationChannel === 'sms' ? 'phone' : 'email',
      registerRequiresVerification: verificationChannel !== 'none',
    };
  }

  @Post('refresh')
  @ApiEndpoint({
    title: '토큰 재발급',
    description: '유효한 리프레시 토큰을 회전시키고 새로운 토큰 쌍을 발급합니다.',
    status: 200,
    response: AuthTokenResponseDto,
    errorStatuses: [400, 401],
    isPublic: true,
  })
  refresh(@Body() dto: RefreshTokenRequestDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @ApiEndpoint({
    title: '로그아웃',
    description: '전달된 리프레시 토큰 세션을 무효화합니다.',
    status: 200,
    response: LogoutResponseDto,
    errorStatuses: [400, 401],
    isPublic: true,
  })
  logout(@Body() dto: RefreshTokenRequestDto) {
    return this.authService.logout(dto);
  }

  @Post('logout-all')
  @RequirePermissions(RBAC.auth.logoutAll)
  @ApiEndpoint({
    title: '전체 로그아웃',
    description: '현재 사용자에게 발급된 모든 리프레시 토큰 세션을 무효화합니다.',
    status: 200,
    response: LogoutResponseDto,
    errorStatuses: [401],
  })
  logoutAll(@CurrentUserId() userId: string) {
    return this.authService.logoutAll(userId);
  }

  @Post('password')
  @RequirePermissions(RBAC.auth.changePassword)
  @ApiEndpoint({
    title: '비밀번호 변경',
    description: '현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.',
    status: 200,
    response: LogoutResponseDto,
    errorStatuses: [400, 401],
  })
  changePassword(@CurrentUserId() userId: string, @Body() dto: ChangePasswordRequestDto) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('password/set')
  @RequirePermissions(RBAC.auth.changePassword)
  @ApiEndpoint({
    title: '비밀번호 최초 설정',
    description: 'OAuth 전용 등 비밀번호가 없는 계정에 최초 비밀번호를 설정합니다.',
    status: 200,
    response: LogoutResponseDto,
    errorStatuses: [400, 401],
  })
  setPassword(@CurrentUserId() userId: string, @Body() dto: SetPasswordRequestDto) {
    return this.authService.setPassword(userId, dto.newPassword);
  }

  @Get('session')
  @RequirePermissions(RBAC.auth.readSession)
  @ApiEndpoint({
    title: '현재 인증 세션 조회',
    description: '현재 액세스 토큰으로 인증된 사용자 정보를 반환합니다.',
    status: 200,
    response: AuthSessionResponseDto,
    errorStatuses: [401],
  })
  session(@CurrentUser() user: Express.User) {
    return {
      user,
    };
  }
}

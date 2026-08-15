import { Body, Controller, Post } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { AUTH_API_CONTROLLER } from '@/common/openapi/openapi-meta';
import { AuthService } from '@/modules/auth/application/auth.service';
import { AuthRegistrationService } from '@/modules/auth/application/auth-registration.service';
import { AuthResponseDto } from '@/modules/auth/presentation/dto/auth-response.dto';
import { EmailRegisterRequestDto } from '@/modules/auth/presentation/dto/email-register.dto';
import { LoginRequestDto } from '@/modules/auth/presentation/dto/login.dto';
import {
  ResendEmailVerificationRequestDto,
  ResendEmailVerificationResponseDto,
  VerifyEmailCodeRequestDto,
} from '@/modules/verification/presentation/dto/email-verification.dto';
import { RegisterPendingResponseDto } from '@/modules/verification/presentation/dto/register-pending-response.dto';

@Controller('auth')
@ApiController({ ...AUTH_API_CONTROLLER })
export class EmailAuthFlowController {
  constructor(
    private readonly authService: AuthService,
    private readonly authRegistrationService: AuthRegistrationService,
  ) {}

  @Post('register')
  @ApiEndpoint({
    title: '회원가입',
    description: '새 사용자 계정을 생성하고 이메일 인증번호를 발송합니다.',
    status: 201,
    response: RegisterPendingResponseDto,
    errorStatuses: [400, 409, 429],
    isPublic: true,
  })
  register(@Body() dto: EmailRegisterRequestDto) {
    return this.authRegistrationService.registerWithEmail(dto);
  }

  @Post('login')
  @ApiEndpoint({
    title: '로그인',
    description: '이메일과 비밀번호로 인증하고 액세스 토큰과 리프레시 토큰을 발급합니다.',
    status: 200,
    response: AuthResponseDto,
    errorStatuses: [400, 401, 403],
    isPublic: true,
  })
  async login(@Body() dto: LoginRequestDto) {
    const user = await this.authService.validateLocalUser(dto.email, dto.password);

    return this.authService.loginLocalUser(user);
  }

  @Post('verification/verify')
  @ApiEndpoint({
    title: '이메일 인증 확인',
    description: '회원가입 후 발송된 이메일 인증번호를 확인하고 로그인 토큰을 발급합니다.',
    status: 200,
    response: AuthResponseDto,
    errorStatuses: [400, 403, 404],
    isPublic: true,
  })
  verify(@Body() dto: VerifyEmailCodeRequestDto) {
    return this.authRegistrationService.verifyRegistration(dto.challengeId, dto.code);
  }

  @Post('verification/resend')
  @ApiEndpoint({
    title: '이메일 인증번호 재발송',
    description: '미인증 계정에 이메일 인증번호를 다시 발송합니다.',
    status: 200,
    response: ResendEmailVerificationResponseDto,
    errorStatuses: [400, 404, 429],
    isPublic: true,
  })
  resend(@Body() dto: ResendEmailVerificationRequestDto) {
    return this.authRegistrationService.resendEmailVerification(dto.userId, dto.email);
  }
}

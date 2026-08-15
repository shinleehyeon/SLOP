import { Body, Controller, Post } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { AUTH_API_CONTROLLER } from '@/common/openapi/openapi-meta';
import { AuthService } from '@/modules/auth/application/auth.service';
import { AuthRegistrationService } from '@/modules/auth/application/auth-registration.service';
import { AuthResponseDto } from '@/modules/auth/presentation/dto/auth-response.dto';
import { PhoneLoginRequestDto } from '@/modules/auth/presentation/dto/phone-login.dto';
import { SmsRegisterRequestDto } from '@/modules/auth/presentation/dto/sms-register.dto';
import { RegisterPendingResponseDto } from '@/modules/verification/presentation/dto/register-pending-response.dto';
import {
  ResendSmsVerificationRequestDto,
  ResendSmsVerificationResponseDto,
  VerifySmsCodeRequestDto,
} from '@/modules/verification/presentation/dto/sms-verification.dto';

@Controller('auth')
@ApiController({ ...AUTH_API_CONTROLLER })
export class SmsAuthFlowController {
  constructor(
    private readonly authService: AuthService,
    private readonly authRegistrationService: AuthRegistrationService,
  ) {}

  @Post('register')
  @ApiEndpoint({
    title: '회원가입',
    description: '새 사용자 계정을 생성하고 SMS 인증번호를 발송합니다.',
    status: 201,
    response: RegisterPendingResponseDto,
    errorStatuses: [400, 409, 429],
    isPublic: true,
  })
  register(@Body() dto: SmsRegisterRequestDto) {
    return this.authRegistrationService.registerWithSms(dto);
  }

  @Post('login')
  @ApiEndpoint({
    title: '로그인',
    description: '전화번호와 비밀번호로 인증하고 액세스 토큰과 리프레시 토큰을 발급합니다.',
    status: 200,
    response: AuthResponseDto,
    errorStatuses: [400, 401, 403],
    isPublic: true,
  })
  async login(@Body() dto: PhoneLoginRequestDto) {
    const user = await this.authService.validateLocalUserByPhone(dto.phone, dto.password);

    return this.authService.loginLocalUser(user);
  }

  @Post('verification/verify')
  @ApiEndpoint({
    title: 'SMS 인증 확인',
    description: '회원가입 후 발송된 SMS 인증번호를 확인하고 로그인 토큰을 발급합니다.',
    status: 200,
    response: AuthResponseDto,
    errorStatuses: [400, 403, 404],
    isPublic: true,
  })
  verify(@Body() dto: VerifySmsCodeRequestDto) {
    return this.authRegistrationService.verifyRegistration(dto.challengeId, dto.code);
  }

  @Post('verification/resend')
  @ApiEndpoint({
    title: 'SMS 인증번호 재발송',
    description: '미인증 계정에 SMS 인증번호를 다시 발송합니다.',
    status: 200,
    response: ResendSmsVerificationResponseDto,
    errorStatuses: [400, 404, 429],
    isPublic: true,
  })
  resend(@Body() dto: ResendSmsVerificationRequestDto) {
    return this.authRegistrationService.resendSmsVerification(dto.userId, dto.phone);
  }
}

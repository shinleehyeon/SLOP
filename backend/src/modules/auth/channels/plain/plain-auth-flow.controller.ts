import { Body, Controller, Post } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { AUTH_API_CONTROLLER } from '@/common/openapi/openapi-meta';
import { AuthService } from '@/modules/auth/application/auth.service';
import { AuthResponseDto } from '@/modules/auth/presentation/dto/auth-response.dto';
import { LoginRequestDto } from '@/modules/auth/presentation/dto/login.dto';
import { RegisterRequestDto } from '@/modules/auth/presentation/dto/register.dto';

@Controller('auth')
@ApiController({ ...AUTH_API_CONTROLLER })
export class PlainAuthFlowController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiEndpoint({
    title: '회원가입',
    description: '새 사용자 계정을 생성하고 액세스 토큰과 리프레시 토큰을 발급합니다.',
    status: 201,
    response: AuthResponseDto,
    errorStatuses: [400, 409],
    isPublic: true,
  })
  register(@Body() dto: RegisterRequestDto) {
    return this.authService.register(dto);
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
}

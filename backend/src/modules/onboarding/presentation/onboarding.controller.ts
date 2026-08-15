import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { OnboardingService } from '../application/onboarding.service';
import { OnboardingSettingsResponseDto } from './dto/onboarding-response.dto';
import { SaveOnboardingSettingsRequestDto } from './dto/save-onboarding.dto';

const SAVE_ONBOARDING_BODY_EXAMPLE = {
  tone: 'CASUAL',
  displayFormat: 'QNA',
  shortsStyle: 'INFO',
  fieldChoices: [
    { fieldName: '인공지능', difficulty: 'HARD' },
    { fieldName: '금융', difficulty: 'MEDIUM' },
  ],
} as const;

@Controller('onboarding')
@ApiController({
  tag: OPENAPI_TAGS.onboarding,
  group: OPENAPI_GROUPS.application,
  description: 'Shortlens 온보딩 개인화 설정',
})
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  @RequirePermissions(RBAC.onboarding.read)
  @ApiEndpoint({
    title: '온보딩 설정 조회',
    description: '로그인 사용자의 온보딩 프로필과 관심 분야 선택을 조회합니다.',
    status: 200,
    response: OnboardingSettingsResponseDto,
    errorStatuses: [401],
  })
  getSettings(@CurrentUserId() userId: string) {
    return this.onboardingService.getSettings(userId);
  }

  @Put()
  @RequirePermissions(RBAC.onboarding.save)
  @ApiBody({
    type: SaveOnboardingSettingsRequestDto,
    examples: {
      default: {
        summary: '프로필 + fieldChoices',
        value: SAVE_ONBOARDING_BODY_EXAMPLE,
      },
    },
  })
  @ApiEndpoint({
    title: '온보딩 설정 저장',
    description:
      '로그인 사용자의 온보딩 프로필(tone, displayFormat, shortsStyle)과 관심 분야 선택(fieldChoices)을 한 번에 저장합니다. fieldChoices는 전체 교체 방식입니다.',
    status: 200,
    response: OnboardingSettingsResponseDto,
    errorStatuses: [400, 401],
  })
  saveSettings(@CurrentUserId() userId: string, @Body() dto: SaveOnboardingSettingsRequestDto) {
    return this.onboardingService.saveSettings(userId, dto);
  }
}

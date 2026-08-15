import { Controller, Get } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { LearningService } from '../application/learning.service';
import { LearningHomeResponseDto } from './dto/learning-home.dto';

@Controller('learning')
@ApiController({
  tag: OPENAPI_TAGS.learning,
  group: OPENAPI_GROUPS.application,
  description: '주간 드래그 표현·관심분야 현황·관련 숏츠',
})
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get('home')
  @RequirePermissions(RBAC.learning.read)
  @ApiEndpoint({
    title: '학습 홈',
    description:
      '이번 주(월 00:00 KST~현재) 저장/드래그 요약, 많이 드래그한 표현, 최근 저장, 관심 분야 현황, 랜덤 관련 숏츠를 한 번에 반환합니다.',
    status: 200,
    response: LearningHomeResponseDto,
    errorStatuses: [401, 403],
  })
  getHome(@CurrentUserId() userId: string) {
    return this.learningService.getHome(userId);
  }
}

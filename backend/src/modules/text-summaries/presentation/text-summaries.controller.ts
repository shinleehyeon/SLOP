import { Body, Controller, Post } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { TextSummariesService } from '../application/text-summaries.service';
import { CreateTextSummaryRequestDto, TextSummaryResponseDto } from './dto/text-summary.dto';

@Controller('text-summaries')
@ApiController({
  tag: OPENAPI_TAGS.textSummaries,
  group: OPENAPI_GROUPS.application,
  description: '드래그 텍스트 온보딩 맞춤 변환·웹 출처(citations)',
})
export class TextSummariesController {
  constructor(private readonly textSummariesService: TextSummariesService) {}

  @Post()
  @RequirePermissions(RBAC.textSummary.create)
  @ApiEndpoint({
    title: '텍스트 요약',
    description:
      '사용자가 드래그한 텍스트를 온보딩(tone/displayFormat/shortsStyle/관심분야 난이도)에 맞게 변환하고, OpenRouter Perplexity(Sonar) content·citations를 반환합니다. 성공 시 Expression으로 자동 저장되며 expressionId를 포함합니다. 온보딩 미완료 시 400입니다.',
    status: 201,
    response: TextSummaryResponseDto,
    errorStatuses: [400, 401, 403, 503],
  })
  create(@CurrentUserId() userId: string, @Body() dto: CreateTextSummaryRequestDto) {
    return this.textSummariesService.create(userId, dto);
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { FieldsService } from '../application/fields.service';
import {
  GenerateFieldTermsRequestDto,
  GenerateFieldTermsResponseDto,
  SaveFieldChoiceRequestDto,
  UserFieldChoiceResponseDto,
} from './dto/fields.dto';

@Controller('fields')
@ApiController({
  tag: OPENAPI_TAGS.fields,
  group: OPENAPI_GROUPS.application,
  description: 'Shortlens 관심 분야 및 용어 생성',
})
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post('generate-terms')
  @RequirePermissions(RBAC.field.generateTerms)
  @ApiEndpoint({
    title: '분야별 용어 생성',
    description: '관심 분야와 어투에 맞는 전문 용어 예시를 생성하거나 캐시에서 반환합니다.',
    status: 200,
    response: GenerateFieldTermsResponseDto,
    errorStatuses: [400, 401, 503, 500],
  })
  generateTerms(@CurrentUserId() userId: string, @Body() dto: GenerateFieldTermsRequestDto) {
    return this.fieldsService.generateTerms(userId, dto);
  }

  @Post('choice')
  @RequirePermissions(RBAC.field.saveChoice)
  @ApiEndpoint({
    title: '분야 선택 저장',
    description: '사용자의 관심 분야와 난이도 선택을 저장합니다.',
    status: 200,
    response: UserFieldChoiceResponseDto,
    errorStatuses: [400, 401],
  })
  saveChoice(@CurrentUserId() userId: string, @Body() dto: SaveFieldChoiceRequestDto) {
    return this.fieldsService.saveChoice(userId, dto);
  }
}

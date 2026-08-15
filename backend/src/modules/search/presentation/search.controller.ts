import { Controller, Get, Query } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { SearchService } from '../application/search.service';
import { SearchHomeResponseDto } from './dto/search-home.dto';
import { SearchQueryRequestDto, SearchQueryResponseDto } from './dto/search-query.dto';

@Controller('search')
@ApiController({
  tag: OPENAPI_TAGS.search,
  group: OPENAPI_GROUPS.application,
  description: '검색 홈 · MeiliSearch 키워드 검색',
})
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('home')
  @RequirePermissions(RBAC.search.read)
  @ApiEndpoint({
    title: '검색 홈',
    description:
      '추천 계정(최근 가입 유저 일부)과 둘러보기용 최신 숏츠 목록을 DB에 있는 데이터로 반환합니다. 각 숏츠에 likeCount·commentCount·likedByMe를 포함합니다.',
    status: 200,
    response: SearchHomeResponseDto,
    errorStatuses: [401, 403],
  })
  getHome(@CurrentUserId() userId: string) {
    return this.searchService.getHome(userId);
  }

  @Get('query')
  @RequirePermissions(RBAC.search.read)
  @ApiEndpoint({
    title: '키워드 검색',
    description:
      'MeiliSearch로 계정·숏츠를 검색합니다. q 필수. types=account,short (기본 둘 다). limit 기본 20.',
    status: 200,
    response: SearchQueryResponseDto,
    errorStatuses: [400, 401, 403, 503],
  })
  query(@Query() query: SearchQueryRequestDto) {
    return this.searchService.query({
      q: query.q,
      types: [...query.types],
      limit: query.limit,
    });
  }
}

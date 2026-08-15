import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AllowAiServiceAuth } from '@/common/decorators/allow-ai-service-auth.decorator';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { ApiPaginationQuery } from '@/common/decorators/api-pagination-query.decorator';
import { CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import type { ShortGenerationStatus } from '@/generated/prisma/client';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { ShortsService } from '../application/shorts.service';
import {
  CheckShortDuplicateRequestDto,
  CheckShortDuplicateResponseDto,
} from './dto/check-short-duplicate.dto';
import {
  CreateShortSeriesRequestDto,
  ShortSeriesListResponseDto,
  ShortSeriesResponseDto,
} from './dto/create-short-series.dto';
import { ShortListResponseDto } from './dto/list-shorts.dto';
import { RecommendShortResponseDto } from './dto/recommend-short.dto';
import {
  ListShortGenerationsQueryDto,
  RequestShortGenerateDto,
  ShortGenerationListResponseDto,
  ShortGenerationResponseDto,
} from './dto/request-short-generate.dto';
import {
  CreateShortCommentRequestDto,
  DeleteShortCommentResponseDto,
  ShortCommentListResponseDto,
  ShortCommentResponseDto,
  ShortLikeToggleResponseDto,
} from './dto/short-engagement.dto';

@Controller('shorts')
@ApiController({
  tag: OPENAPI_TAGS.shorts,
  group: OPENAPI_GROUPS.application,
  description: 'Shortlens 숏폼 시리즈·편 관리',
})
export class ShortsController {
  constructor(private readonly shortsService: ShortsService) {}

  @Get('recommend')
  @RequirePermissions(RBAC.short.suggest)
  @ApiEndpoint({
    title: '쇼츠 추천',
    description:
      'AI GET /v1/recommend?user_id=… 프록시입니다. 로그인 유저 기준으로 선호 가중 랜덤 쇼츠를 추천합니다.',
    status: 200,
    response: RecommendShortResponseDto,
    errorStatuses: [401, 403, 502, 503],
  })
  recommend(@CurrentUserId() userId: string) {
    return this.shortsService.recommend(userId);
  }

  @Get()
  @RequirePermissions(RBAC.short.listSeries)
  @ApiPaginationQuery()
  @ApiEndpoint({
    title: '최신 쇼츠 목록',
    description: '전체 최신 쇼츠(편) 목록입니다. 둘러보기용.',
    status: 200,
    response: ShortListResponseDto,
    errorStatuses: [400, 401, 403],
  })
  listLatest(@CurrentUserId() userId: string, @Query() query: PaginationQueryDto) {
    return this.shortsService.listLatestShorts(userId, query);
  }

  @Get('me')
  @RequirePermissions(RBAC.short.listSeries)
  @ApiPaginationQuery()
  @ApiEndpoint({
    title: '내 쇼츠 목록',
    description: '내가 제작한 시리즈에 속한 쇼츠(편) 목록입니다.',
    status: 200,
    response: ShortListResponseDto,
    errorStatuses: [400, 401, 403],
  })
  listMine(@CurrentUserId() userId: string, @Query() query: PaginationQueryDto) {
    return this.shortsService.listMyShorts(userId, query);
  }

  @Post('duplicates/check')
  @RequirePermissions(RBAC.short.checkDuplicate)
  @ApiEndpoint({
    title: '쇼츠 중복 검사',
    description:
      'AI POST /v1/duplicates/check 프록시입니다. 클라이언트가 넘긴 url로 중복·유사 쇼츠를 조회합니다.',
    status: 200,
    response: CheckShortDuplicateResponseDto,
    errorStatuses: [400, 401, 403, 502, 503],
  })
  checkDuplicate(@Body() dto: CheckShortDuplicateRequestDto) {
    return this.shortsService.checkDuplicate(dto.url);
  }

  @Post('generate')
  @RequirePermissions(RBAC.short.requestGenerate)
  @ApiEndpoint({
    title: '숏폼 제작 요청',
    description:
      '콘텐츠·링크·첨부 파일로 Community Shorts Agent에 비동기 생성을 요청합니다. 즉시 GENERATING 상태로 응답하며, 완료 후 AI가 POST /shorts/series로 시리즈를 저장합니다.',
    status: 202,
    response: ShortGenerationResponseDto,
    errorStatuses: [400, 401, 403, 404, 502, 503],
  })
  requestGenerate(@CurrentUserId() userId: string, @Body() dto: RequestShortGenerateDto) {
    return this.shortsService.requestGenerate(userId, dto);
  }

  @Get('generations')
  @RequirePermissions(RBAC.short.listGenerations)
  @ApiEndpoint({
    title: '숏폼 제작 요청 목록',
    description:
      '내 숏폼 제작 요청 목록입니다. status 쿼리로 생성 중(GENERATING)만 필터할 수 있습니다.',
    status: 200,
    response: ShortGenerationListResponseDto,
    errorStatuses: [400, 401, 403],
  })
  listGenerations(@CurrentUserId() userId: string, @Query() query: ListShortGenerationsQueryDto) {
    return this.shortsService.listGenerations(
      userId,
      query.status as ShortGenerationStatus | undefined,
    );
  }

  @Get('generations/:generationId')
  @RequirePermissions(RBAC.short.listGenerations)
  @ApiEndpoint({
    title: '숏폼 제작 요청 조회',
    description: '제작 요청 단건 조회(폴링용).',
    status: 200,
    response: ShortGenerationResponseDto,
    errorStatuses: [401, 403, 404],
  })
  getGeneration(@CurrentUserId() userId: string, @Param('generationId') generationId: string) {
    return this.shortsService.getGeneration(userId, generationId);
  }

  @Get('users/:userId/series')
  @RequirePermissions(RBAC.short.listSeries)
  @ApiEndpoint({
    title: '유저 숏폼 시리즈 목록',
    description:
      '특정 유저가 제작한 숏폼 시리즈 목록입니다. shortCount만 포함하며, 편 목록은 시리즈 상세에서 조회합니다.',
    status: 200,
    response: ShortSeriesListResponseDto,
    errorStatuses: [401, 403],
  })
  listSeriesByUser(@Param('userId') userId: string) {
    return this.shortsService.listSeriesByUser(userId);
  }

  @Get('series/:seriesId')
  @RequirePermissions(RBAC.short.readSeries)
  @ApiEndpoint({
    title: '숏폼 시리즈 상세',
    description:
      '시리즈와 포함된 쇼츠(편) 목록·영상 URL·좋아요/댓글 수를 반환합니다. likedByMe는 현재 사용자 기준입니다.',
    status: 200,
    response: ShortSeriesResponseDto,
    errorStatuses: [401, 403, 404],
  })
  getSeries(@CurrentUserId() userId: string, @Param('seriesId') seriesId: string) {
    return this.shortsService.getSeries(seriesId, userId);
  }

  @Post('series')
  @AllowAiServiceAuth()
  @RequirePermissions(RBAC.short.createSeries)
  @ApiEndpoint({
    title: '숏폼 시리즈 저장',
    description:
      '시리즈와 여러 편(1편, 2편…)을 한 번에 저장합니다. AI는 X-AI-API-Key로 호출합니다. generationRequestId에는 short_generation_requests.id 또는 AI job_id를 넣을 수 있습니다.',
    status: 201,
    response: ShortSeriesResponseDto,
    errorStatuses: [400, 401, 403, 404, 409],
  })
  createSeries(
    @CurrentUserId() userId: string,
    @Body() dto: CreateShortSeriesRequestDto,
    @Req() req: Request,
  ) {
    return this.shortsService.createSeries(userId, dto, req.body);
  }

  @Post(':shortId/like')
  @RequirePermissions(RBAC.short.like)
  @ApiEndpoint({
    title: '쇼츠 하트 토글',
    description:
      '이미 눌렀으면 취소, 아니면 좋아요합니다. 현재 liked 상태와 likeCount를 반환합니다.',
    status: 200,
    response: ShortLikeToggleResponseDto,
    errorStatuses: [401, 403, 404],
  })
  toggleLike(@CurrentUserId() userId: string, @Param('shortId') shortId: string) {
    return this.shortsService.toggleLike(userId, shortId);
  }

  @Get(':shortId/comments')
  @RequirePermissions(RBAC.short.listComments)
  @ApiPaginationQuery()
  @ApiEndpoint({
    title: '쇼츠 댓글 목록',
    description: '최신순 댓글 목록입니다.',
    status: 200,
    response: ShortCommentListResponseDto,
    errorStatuses: [401, 403, 404],
  })
  listComments(@Param('shortId') shortId: string, @Query() query: PaginationQueryDto) {
    return this.shortsService.listComments(shortId, query);
  }

  @Post(':shortId/comments')
  @RequirePermissions(RBAC.short.createComment)
  @ApiEndpoint({
    title: '쇼츠 댓글 작성',
    status: 201,
    response: ShortCommentResponseDto,
    errorStatuses: [400, 401, 403, 404],
  })
  createComment(
    @CurrentUserId() userId: string,
    @Param('shortId') shortId: string,
    @Body() dto: CreateShortCommentRequestDto,
  ) {
    return this.shortsService.createComment(userId, shortId, dto);
  }

  @Delete(':shortId/comments/:commentId')
  @RequirePermissions(RBAC.short.deleteComment)
  @ApiEndpoint({
    title: '쇼츠 댓글 삭제',
    description: '본인이 작성한 댓글만 삭제할 수 있습니다.',
    status: 200,
    response: DeleteShortCommentResponseDto,
    errorStatuses: [401, 403, 404],
  })
  deleteComment(
    @CurrentUserId() userId: string,
    @Param('shortId') shortId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.shortsService.deleteComment(userId, shortId, commentId);
  }
}

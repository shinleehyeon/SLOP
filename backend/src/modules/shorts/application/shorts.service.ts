import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  createPaginationMeta,
  getPaginationOffset,
  type PaginationQueryDto,
} from '@/common/dto/pagination.dto';
import { FilePurpose, ShortGenerationStatus } from '@/generated/prisma/client';
import { AiService } from '@/infrastructure/ai-service/ai-service.service';
import { SearchIndexerService } from '@/infrastructure/meilisearch/search-indexer.service';
import { AUDIT_LOG_ACTIONS } from '@/modules/audit-log/application/audit-log.actions';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { FileDirectory } from '@/modules/files/application/file-directory.enum';
import { FilesService } from '@/modules/files/application/files.service';
import { OnboardingService } from '@/modules/onboarding/application/onboarding.service';
import { ShortsRepository } from '../infrastructure/shorts.repository';
import type { CreateShortSeriesRequestDto } from '../presentation/dto/create-short-series.dto';
import type { RequestShortGenerateDto } from '../presentation/dto/request-short-generate.dto';
import type { CreateShortCommentRequestDto } from '../presentation/dto/short-engagement.dto';

@Injectable()
export class ShortsService {
  private readonly logger = new Logger(ShortsService.name);

  constructor(
    private readonly shortsRepository: ShortsRepository,
    private readonly filesService: FilesService,
    private readonly auditLogService: AuditLogService,
    private readonly aiService: AiService,
    private readonly searchIndexer: SearchIndexerService,
    private readonly onboardingService: OnboardingService,
  ) {}

  async requestGenerate(userId: string, dto: RequestShortGenerateDto) {
    const content = dto.content?.trim() || null;
    const links = dto.links ?? [];
    const attachmentFileIds = dto.attachments ?? [];
    const requestedSiteUrl = dto.requestedSiteUrl?.trim() || null;

    const settings = await this.onboardingService.getSettings(userId);
    const onboarding = JSON.stringify(settings);

    const attachmentFiles = [];
    for (const fileId of attachmentFileIds) {
      const file = await this.filesService.getOwnedTemporaryGeneralFile(fileId, userId);
      attachmentFiles.push(file);
    }

    const request = await this.shortsRepository.createGenerationRequest({
      userId,
      requestedSiteUrl,
      content,
      links,
      attachmentFileIds,
      status: ShortGenerationStatus.GENERATING,
    });

    const attachmentUrls = attachmentFiles.map((file) => this.filesService.getPublicUrl(file.key));
    const urls = [...links, ...attachmentUrls];

    try {
      const aiJobId = await this.aiService.generateShortsAsync({
        userId,
        content,
        urls,
        onboarding,
      });

      const updated = await this.shortsRepository.updateGenerationRequest(request.id, {
        aiJobId,
      });

      this.logger.log(
        `generate dispatched requestId=${updated.id} aiJobId=${aiJobId} userId=${userId}`,
      );

      await this.auditLogService.record({
        action: AUDIT_LOG_ACTIONS.shortGenerationRequested,
        actorId: userId,
        targetType: 'short_generation_request',
        targetId: updated.id,
        metadata: {
          aiJobId,
          attachmentCount: attachmentFileIds.length,
          linkCount: links.length,
          requestedSiteUrl,
        },
      });

      return this.serializeGeneration(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI dispatch failed';

      await this.shortsRepository.updateGenerationRequest(request.id, {
        status: ShortGenerationStatus.DISPATCH_FAILED,
        errorMessage: message,
      });

      throw error;
    }
  }

  async recommend(userId: string) {
    const result = await this.aiService.recommend(userId);
    const downloadUrlByJobId = await this.resolveDownloadUrlsByAiJobIds([result.job_id]);

    return {
      userId: result.user_id,
      jobId: result.job_id,
      title: result.title ?? null,
      style: result.style ?? null,
      tags: result.tags ?? [],
      downloadUrl: downloadUrlByJobId.get(result.job_id) ?? null,
      vportSeriesId: result.vport_series_id ?? null,
      vportPublicUrl: result.vport_public_url ?? null,
      durationSec: result.duration_sec ?? null,
      episodeCount: result.episode_count ?? null,
      matchScore: result.match_score ?? null,
    };
  }

  async checkDuplicate(url: string) {
    const result = await this.aiService.checkDuplicates(url);
    const jobIds = [
      ...new Set([
        ...result.job_ids,
        ...result.matches.map((match) => match.job_id).filter(Boolean),
      ]),
    ];
    const downloadUrlByJobId = await this.resolveDownloadUrlsByAiJobIds(jobIds);

    return {
      duplicate: result.duplicate,
      similar: result.similar,
      jobIds: result.job_ids,
      matches: result.matches.map((match) => ({
        jobId: match.job_id,
        matchType: match.match_type,
        duplicate: match.duplicate,
        similar: match.similar,
        score: match.score,
        reasons: match.reasons ?? [],
        title: match.title ?? null,
        downloadUrl: downloadUrlByJobId.get(match.job_id) ?? null,
        overlapUrls: match.overlap_urls ?? [],
      })),
    };
  }

  private async resolveDownloadUrlsByAiJobIds(aiJobIds: string[]) {
    const rows = await this.shortsRepository.findVideoKeysByAiJobIds(aiJobIds);
    const downloadUrlByJobId = new Map<string, string>();

    for (const row of rows) {
      if (!row.aiJobId || downloadUrlByJobId.has(row.aiJobId)) {
        continue;
      }

      const key = row.series?.shorts[0]?.videoFile.key;
      if (!key) {
        continue;
      }

      downloadUrlByJobId.set(row.aiJobId, this.filesService.getPublicUrl(key));
    }

    return downloadUrlByJobId;
  }

  async listGenerations(userId: string, status?: ShortGenerationStatus) {
    const items = await this.shortsRepository.listGenerationRequests(userId, status);
    return {
      items: items.map((item) => this.serializeGeneration(item)),
    };
  }

  async getGeneration(userId: string, generationId: string) {
    const request = await this.shortsRepository.findGenerationRequestById(generationId);

    if (!request) {
      throw new NotFoundException('Generation request not found');
    }

    if (request.userId !== userId) {
      throw new ForbiddenException('Generation request does not belong to the current user');
    }

    return this.serializeGeneration(request);
  }

  async listSeriesByUser(userId: string) {
    const items = await this.shortsRepository.listSeriesByUserId(userId);

    return {
      items: items.map((series) => ({
        id: series.id,
        userId: series.userId,
        title: series.title,
        style: series.style,
        requestedSiteUrl: series.requestedSiteUrl,
        shortCount: series._count.shorts,
        createdAt: series.createdAt.toISOString(),
        updatedAt: series.updatedAt.toISOString(),
      })),
    };
  }

  async listMyShorts(userId: string, query: PaginationQueryDto) {
    return this.listShortsFeed(userId, query, userId);
  }

  async listLatestShorts(viewerUserId: string, query: PaginationQueryDto) {
    return this.listShortsFeed(viewerUserId, query);
  }

  private async listShortsFeed(
    viewerUserId: string,
    query: PaginationQueryDto,
    ownerUserId?: string,
  ) {
    const skip = getPaginationOffset(query);
    const [items, total] = await Promise.all([
      this.shortsRepository.listShorts({
        userId: ownerUserId,
        skip,
        take: query.limit,
      }),
      this.shortsRepository.countShorts(ownerUserId),
    ]);

    const likedShortIds = await this.shortsRepository.findLikedShortIds(
      viewerUserId,
      items.map((short) => short.id),
    );
    const likedSet = new Set(likedShortIds);

    return {
      items: items.map((short) => ({
        id: short.id,
        seriesId: short.seriesId,
        seriesTitle: short.series.title,
        episodeNumber: short.episodeNumber,
        title: short.title,
        tags: short.tags,
        videoFileUrl: this.filesService.getPublicUrl(short.videoFile.key),
        likeCount: short._count.likes,
        commentCount: short._count.comments,
        likedByMe: likedSet.has(short.id),
        creatorUserId: short.series.user.id,
        creatorName: short.series.user.name,
        createdAt: short.createdAt.toISOString(),
      })),
      meta: createPaginationMeta({ page: query.page, limit: query.limit, total }),
    };
  }

  async getSeries(seriesId: string, viewerUserId: string) {
    const series = await this.shortsRepository.findSeriesById(seriesId);

    if (!series) {
      throw new NotFoundException('Short series not found');
    }

    const likedShortIds = await this.shortsRepository.findLikedShortIds(
      viewerUserId,
      series.shorts.map((short) => short.id),
    );
    const likedSet = new Set(likedShortIds);

    return this.serializeSeries(
      series,
      series.shorts.map((short) => ({
        id: short.videoFileId,
        key: short.videoFile.key,
      })),
      likedSet,
    );
  }

  async createSeries(userId: string, dto: CreateShortSeriesRequestDto, rawBody?: unknown) {
    const fileIds = dto.shorts.map((short) => short.fileId);
    const uniqueFileIds = new Set(fileIds);

    if (uniqueFileIds.size !== fileIds.length) {
      throw new BadRequestException('Duplicate fileId in shorts');
    }

    this.logger.log(
      `POST /shorts/series actorUserId=${userId || '(ai)'} rawBody=${JSON.stringify(rawBody ?? null)}`,
    );
    this.logger.log(
      `POST /shorts/series parsed title=${dto.title} style=${dto.style} generationRequestId=${dto.generationRequestId ?? '(none)'} userId=${dto.userId ?? '(none)'} shortCount=${dto.shorts.length} fileIds=${JSON.stringify(fileIds)}`,
    );

    const { ownerId, generationRequestId } = await this.resolveSeriesOwner(userId, dto);

    const attachedFiles = [];

    for (const short of dto.shorts) {
      const file = await this.filesService.attachOwnedFile({
        fileId: short.fileId,
        ownerId,
        expectedPurpose: FilePurpose.GENERAL,
        destinationDirectory: FileDirectory.SHORTS,
        allowUnowned: !userId,
      });
      attachedFiles.push(file);
    }

    const series = await this.shortsRepository.createSeriesWithShorts({
      userId: ownerId,
      title: dto.title,
      style: dto.style,
      requestedSiteUrl: dto.requestedSiteUrl?.trim() || null,
      generationRequestId,
      shorts: dto.shorts.map((short, index) => ({
        episodeNumber: index + 1,
        title: short.title,
        tags: short.tags.map((tag) => tag.trim()).filter(Boolean),
        videoFileId: short.fileId,
      })),
    });

    this.logger.log(
      `POST /shorts/series saved seriesId=${series.id} ownerId=${ownerId} linkedGenerationRequestId=${generationRequestId ?? '(none — status stays GENERATING)'}`,
    );

    await this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.shortSeriesCreated,
      actorId: ownerId,
      targetType: 'short_series',
      targetId: series.id,
      metadata: {
        style: series.style,
        shortCount: series.shorts.length,
        requestedSiteUrl: series.requestedSiteUrl,
        generationRequestId: generationRequestId ?? null,
      },
    });

    this.searchIndexer.indexShortsBySeriesId(series.id);
    this.searchIndexer.indexAccountById(ownerId);

    return this.serializeSeries(series, attachedFiles, new Set());
  }

  async toggleLike(userId: string, shortId: string) {
    const short = await this.shortsRepository.findShortById(shortId);

    if (!short) {
      throw new NotFoundException('Short not found');
    }

    const existing = await this.shortsRepository.findLike(shortId, userId);

    if (existing) {
      await this.shortsRepository.deleteLike(shortId, userId);
      const likeCount = await this.shortsRepository.countLikes(shortId);

      await this.auditLogService.record({
        action: AUDIT_LOG_ACTIONS.shortUnliked,
        actorId: userId,
        targetType: 'short',
        targetId: shortId,
        metadata: { likeCount },
      });

      return { shortId, liked: false, likeCount };
    }

    await this.shortsRepository.createLike(shortId, userId);
    const likeCount = await this.shortsRepository.countLikes(shortId);

    await this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.shortLiked,
      actorId: userId,
      targetType: 'short',
      targetId: shortId,
      metadata: { likeCount },
    });

    return { shortId, liked: true, likeCount };
  }

  async createComment(userId: string, shortId: string, dto: CreateShortCommentRequestDto) {
    const short = await this.shortsRepository.findShortById(shortId);

    if (!short) {
      throw new NotFoundException('Short not found');
    }

    const comment = await this.shortsRepository.createComment(shortId, userId, dto.content);

    await this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.shortCommentCreated,
      actorId: userId,
      targetType: 'short_comment',
      targetId: comment.id,
      metadata: { shortId },
    });

    return this.serializeComment(comment);
  }

  async listComments(shortId: string, query: PaginationQueryDto) {
    const short = await this.shortsRepository.findShortById(shortId);

    if (!short) {
      throw new NotFoundException('Short not found');
    }

    const skip = getPaginationOffset(query);
    const [items, total] = await Promise.all([
      this.shortsRepository.listComments(shortId, skip, query.limit),
      this.shortsRepository.countComments(shortId),
    ]);

    return {
      items: items.map((item) => this.serializeComment(item)),
      meta: createPaginationMeta({ page: query.page, limit: query.limit, total }),
    };
  }

  async deleteComment(userId: string, shortId: string, commentId: string) {
    const short = await this.shortsRepository.findShortById(shortId);

    if (!short) {
      throw new NotFoundException('Short not found');
    }

    const comment = await this.shortsRepository.findCommentById(commentId);

    if (!comment || comment.shortId !== shortId) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Comment does not belong to the current user');
    }

    await this.shortsRepository.deleteComment(commentId);

    await this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.shortCommentDeleted,
      actorId: userId,
      targetType: 'short_comment',
      targetId: commentId,
      metadata: { shortId },
    });

    return { id: commentId, deleted: true as const };
  }

  /**
   * generationRequestId accepts either short_generation_requests.id or AI job_id (aiJobId).
   * Returns the real request.id for COMPLETED linking.
   */
  private async resolveSeriesOwner(
    actorUserId: string,
    dto: Pick<CreateShortSeriesRequestDto, 'generationRequestId' | 'userId'>,
  ): Promise<{ ownerId: string; generationRequestId?: string }> {
    if (dto.generationRequestId) {
      const byId = await this.shortsRepository.findGenerationRequestById(dto.generationRequestId);
      const byAiJobId = byId
        ? null
        : await this.shortsRepository.findGenerationRequestByAiJobId(dto.generationRequestId);
      const request = byId ?? byAiJobId;
      const matchedBy = byId ? 'id' : byAiJobId ? 'aiJobId' : 'none';

      this.logger.log(
        `resolveSeriesOwner generationRequestId=${dto.generationRequestId} matchedBy=${matchedBy} requestId=${request?.id ?? '(null)'} requestStatus=${request?.status ?? '(null)'} requestAiJobId=${request?.aiJobId ?? '(null)'}`,
      );

      if (!request) {
        throw new NotFoundException(
          'Generation request not found. generationRequestId must be short_generation_requests.id or aiJobId.',
        );
      }

      if (actorUserId && request.userId !== actorUserId) {
        throw new ForbiddenException('Generation request does not belong to the current user');
      }

      if (request.status === ShortGenerationStatus.COMPLETED) {
        throw new ConflictException('Generation request is already completed');
      }

      if (request.status !== ShortGenerationStatus.GENERATING) {
        throw new BadRequestException('Generation request is not in GENERATING status');
      }

      return { ownerId: request.userId, generationRequestId: request.id };
    }

    const ownerId = actorUserId || dto.userId;

    this.logger.warn(
      `resolveSeriesOwner generationRequestId omitted — series will save but no request marked COMPLETED. actorUserId=${actorUserId || '(none)'} bodyUserId=${dto.userId ?? '(none)'} ownerId=${ownerId || '(none)'}`,
    );

    if (!ownerId) {
      throw new BadRequestException(
        'body.userId (or user_id) is required when generationRequestId is omitted',
      );
    }

    return { ownerId };
  }

  private serializeGeneration(request: {
    id: string;
    status: ShortGenerationStatus;
    requestedSiteUrl: string | null;
    content: string | null;
    links: string[];
    attachmentFileIds: string[];
    seriesId: string | null;
    aiJobId: string | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: request.id,
      status: request.status,
      requestedSiteUrl: request.requestedSiteUrl,
      content: request.content,
      links: request.links,
      attachmentFileIds: request.attachmentFileIds,
      seriesId: request.seriesId,
      aiJobId: request.aiJobId,
      errorMessage: request.errorMessage,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }

  private serializeComment(comment: {
    id: string;
    shortId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      name: string;
      profileImage: { key: string } | null;
    };
  }) {
    return {
      id: comment.id,
      shortId: comment.shortId,
      content: comment.content,
      author: {
        id: comment.user.id,
        name: comment.user.name,
        profileImageUrl: comment.user.profileImage?.key
          ? this.filesService.getPublicUrl(comment.user.profileImage.key)
          : null,
      },
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  private serializeSeries(
    series: {
      id: string;
      userId: string;
      title: string;
      style: string;
      requestedSiteUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
      shorts: Array<{
        id: string;
        seriesId: string;
        episodeNumber: number;
        title: string;
        tags: string[];
        videoFileId: string;
        createdAt: Date;
        updatedAt: Date;
        videoFile: {
          key: string;
        };
        _count: {
          likes: number;
          comments: number;
        };
      }>;
    },
    attachedFiles: Array<{ id: string; key: string }>,
    likedShortIds: Set<string>,
  ) {
    const fileUrlById = new Map(
      attachedFiles.map((file) => [file.id, this.filesService.getPublicUrl(file.key)]),
    );

    return {
      id: series.id,
      userId: series.userId,
      title: series.title,
      style: series.style,
      requestedSiteUrl: series.requestedSiteUrl,
      createdAt: series.createdAt.toISOString(),
      updatedAt: series.updatedAt.toISOString(),
      shorts: series.shorts.map((short) => ({
        id: short.id,
        seriesId: short.seriesId,
        episodeNumber: short.episodeNumber,
        title: short.title,
        tags: short.tags,
        videoFileId: short.videoFileId,
        videoFileUrl:
          fileUrlById.get(short.videoFileId) ?? this.filesService.getPublicUrl(short.videoFile.key),
        likeCount: short._count.likes,
        commentCount: short._count.comments,
        likedByMe: likedShortIds.has(short.id),
        createdAt: short.createdAt.toISOString(),
        updatedAt: short.updatedAt.toISOString(),
      })),
    };
  }
}

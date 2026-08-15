import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MeiliSearchService } from '@/infrastructure/meilisearch/meilisearch.service';
import { FilesService } from '@/modules/files/application/files.service';
import { SearchRepository } from '../infrastructure/search.repository';

@Injectable()
export class SearchService {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly filesService: FilesService,
    private readonly meiliSearchService: MeiliSearchService,
  ) {}

  async query(input: { q: string; types: Array<'account' | 'short'>; limit: number }) {
    if (!this.meiliSearchService.isReady()) {
      try {
        await this.meiliSearchService.ensureIndexes();
      } catch {
        throw new ServiceUnavailableException('Search is temporarily unavailable');
      }
    }

    const includeAccounts = input.types.includes('account');
    const includeShorts = input.types.includes('short');

    const [accountsResult, shortsResult] = await Promise.all([
      includeAccounts
        ? this.meiliSearchService.searchAccounts(input.q, input.limit)
        : Promise.resolve({
            hits: [] as Awaited<ReturnType<MeiliSearchService['searchAccounts']>>['hits'],
          }),
      includeShorts
        ? this.meiliSearchService.searchShorts(input.q, input.limit)
        : Promise.resolve({
            hits: [] as Awaited<ReturnType<MeiliSearchService['searchShorts']>>['hits'],
          }),
    ]);

    return {
      query: input.q,
      accounts: accountsResult.hits.map((hit) => ({
        userId: hit.id,
        name: hit.name,
        description: hit.description,
        shortSeriesCount: hit.shortSeriesCount,
        profileImageUrl: hit.profileImageUrl,
      })),
      shorts: shortsResult.hits.map((hit) => ({
        shortId: hit.id,
        seriesId: hit.seriesId,
        title: hit.title,
        seriesTitle: hit.seriesTitle,
        tags: hit.tags,
        videoUrl: hit.videoUrl,
        creatorUserId: hit.creatorUserId,
        creatorName: hit.creatorName,
        createdAt: new Date(hit.createdAt).toISOString(),
      })),
    };
  }

  async getHome(userId: string) {
    const [users, shorts] = await Promise.all([
      this.searchRepository.findRecommendedUsers(8, userId),
      this.searchRepository.findLatestShorts(12),
    ]);

    const likedShortIds = await this.searchRepository.findLikedShortIds(
      userId,
      shorts.map((short) => short.id),
    );
    const likedSet = new Set(likedShortIds);

    return {
      recommendedAccounts: users.map((user) => ({
        userId: user.id,
        name: user.name,
        description: user.fieldChoices.map((choice) => choice.field.name).join(' · ') || null,
        shortSeriesCount: user._count.shortSeries,
        profileImageUrl: user.profileImage?.key
          ? this.filesService.getPublicUrl(user.profileImage.key)
          : null,
      })),
      exploreShorts: shorts.map((short) => ({
        shortId: short.id,
        seriesId: short.seriesId,
        title: short.title,
        seriesTitle: short.series.title,
        tags: short.tags,
        videoUrl: this.filesService.getPublicUrl(short.videoFile.key),
        creatorUserId: short.series.user.id,
        creatorName: short.series.user.name,
        likeCount: short._count.likes,
        commentCount: short._count.comments,
        likedByMe: likedSet.has(short.id),
        createdAt: short.createdAt.toISOString(),
      })),
    };
  }
}

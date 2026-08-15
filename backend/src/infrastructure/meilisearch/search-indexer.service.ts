import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { FilesService } from '@/modules/files/application/files.service';
import { MeiliSearchService } from './meilisearch.service';
import type { MeiliAccountDocument, MeiliShortDocument } from './meilisearch.types';

@Injectable()
export class SearchIndexerService {
  private readonly logger = new Logger(SearchIndexerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly meiliSearchService: MeiliSearchService,
  ) {}

  indexAccountById(userId: string) {
    void this.safeRun(`upsert account ${userId}`, async () => {
      const document = await this.buildAccountDocument(userId);
      if (document) {
        await this.meiliSearchService.upsertAccounts([document]);
      }
    });
  }

  indexShortsBySeriesId(seriesId: string) {
    void this.safeRun(`upsert shorts series ${seriesId}`, async () => {
      const documents = await this.buildShortDocumentsBySeriesId(seriesId);
      await this.meiliSearchService.upsertShorts(documents);
    });
  }

  removeAccount(userId: string) {
    return this.safeRun(`delete account ${userId}`, async () => {
      const shortIds = await this.prisma.short.findMany({
        where: { series: { userId } },
        select: { id: true },
      });
      await this.meiliSearchService.deleteShorts(shortIds.map((short) => short.id));
      await this.meiliSearchService.deleteAccount(userId);
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  reindexAllCron() {
    void this.reindexAll();
  }

  async reindexAll() {
    await this.safeRun('full reindex', async () => {
      await this.meiliSearchService.ensureIndexes();

      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          profileImage: { select: { key: true } },
          fieldChoices: {
            select: { field: { select: { name: true } } },
            orderBy: { createdAt: 'asc' },
          },
          _count: { select: { shortSeries: true } },
        },
      });

      const accountDocuments: MeiliAccountDocument[] = users.map((user) => {
        const fieldNames = user.fieldChoices.map((choice) => choice.field.name);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          fieldNames,
          description: fieldNames.length > 0 ? fieldNames.join(' · ') : null,
          shortSeriesCount: user._count.shortSeries,
          profileImageUrl: user.profileImage?.key
            ? this.filesService.getPublicUrl(user.profileImage.key)
            : null,
          createdAt: user.createdAt.getTime(),
        };
      });

      const shorts = await this.prisma.short.findMany({
        select: {
          id: true,
          seriesId: true,
          title: true,
          tags: true,
          createdAt: true,
          videoFile: { select: { key: true } },
          series: {
            select: {
              title: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
      });

      const shortDocuments: MeiliShortDocument[] = shorts.map((short) => ({
        id: short.id,
        seriesId: short.seriesId,
        title: short.title,
        seriesTitle: short.series.title,
        tags: short.tags,
        videoUrl: this.filesService.getPublicUrl(short.videoFile.key),
        creatorUserId: short.series.user.id,
        creatorName: short.series.user.name,
        createdAt: short.createdAt.getTime(),
      }));

      // Replace entire indexes for repair consistency
      await this.meiliSearchService.accountsIndex().deleteAllDocuments();
      await this.meiliSearchService.shortsIndex().deleteAllDocuments();
      await this.meiliSearchService.upsertAccounts(accountDocuments);
      await this.meiliSearchService.upsertShorts(shortDocuments);

      this.logger.log(
        `MeiliSearch reindex done accounts=${accountDocuments.length} shorts=${shortDocuments.length}`,
      );
    });
  }

  private async buildAccountDocument(userId: string): Promise<MeiliAccountDocument | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        profileImage: { select: { key: true } },
        fieldChoices: {
          select: { field: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { shortSeries: true } },
      },
    });

    if (!user) {
      return null;
    }

    const fieldNames = user.fieldChoices.map((choice) => choice.field.name);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      fieldNames,
      description: fieldNames.length > 0 ? fieldNames.join(' · ') : null,
      shortSeriesCount: user._count.shortSeries,
      profileImageUrl: user.profileImage?.key
        ? this.filesService.getPublicUrl(user.profileImage.key)
        : null,
      createdAt: user.createdAt.getTime(),
    };
  }

  private async buildShortDocumentsBySeriesId(seriesId: string): Promise<MeiliShortDocument[]> {
    const shorts = await this.prisma.short.findMany({
      where: { seriesId },
      select: {
        id: true,
        seriesId: true,
        title: true,
        tags: true,
        createdAt: true,
        videoFile: { select: { key: true } },
        series: {
          select: {
            title: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    return shorts.map((short) => ({
      id: short.id,
      seriesId: short.seriesId,
      title: short.title,
      seriesTitle: short.series.title,
      tags: short.tags,
      videoUrl: this.filesService.getPublicUrl(short.videoFile.key),
      creatorUserId: short.series.user.id,
      creatorName: short.series.user.name,
      createdAt: short.createdAt.getTime(),
    }));
  }

  private async safeRun(label: string, fn: () => Promise<void>) {
    try {
      if (!this.meiliSearchService.isReady()) {
        await this.meiliSearchService.ensureIndexes();
      }
      await fn();
    } catch (error) {
      this.logger.warn(
        `MeiliSearch ${label} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

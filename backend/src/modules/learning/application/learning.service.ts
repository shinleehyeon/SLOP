import { Injectable } from '@nestjs/common';
import { getCurrentWeekRangeKst } from '@/common/time/week-range-kst';
import { ExpressionsRepository } from '@/modules/expressions/infrastructure/expressions.repository';
import { FilesService } from '@/modules/files/application/files.service';

@Injectable()
export class LearningService {
  constructor(
    private readonly expressionsRepository: ExpressionsRepository,
    private readonly filesService: FilesService,
  ) {}

  async getHome(userId: string) {
    const week = getCurrentWeekRangeKst();
    const [
      savedCount,
      totalDragCount,
      interestFieldCount,
      frequentRaw,
      recentRaw,
      fieldStats,
      randomShorts,
    ] = await Promise.all([
      this.expressionsRepository.countExpressionsFirstDraggedInRange(userId, week.start, week.end),
      this.expressionsRepository.countDragsInRange(userId, week.start, week.end),
      this.expressionsRepository.countUserInterestFields(userId),
      this.expressionsRepository.findFrequentInRange(userId, week.start, week.end, 10),
      this.expressionsRepository.findRecent(userId, 10),
      this.expressionsRepository.fieldStatsInRange(userId, week.start, week.end),
      this.expressionsRepository.findRandomShorts(1),
    ]);

    const frequentExpressions = frequentRaw.map((expression) => ({
      id: expression.id,
      title: expression.title,
      definition: expression.definition,
      dragCount: expression.weekDragCount,
      sourceTitle: expression.sourceTitle,
      sourceUrl: expression.sourceUrl,
      fieldName: expression.field?.name ?? null,
    }));

    const recentExpressions = recentRaw.map((expression) => ({
      id: expression.id,
      title: expression.title,
      fieldName: expression.field?.name ?? null,
      sourceTitle: expression.sourceTitle,
      savedAt: expression.savedAt.toISOString(),
    }));

    const relatedShorts = randomShorts.map((short) => ({
      shortId: short.shortId,
      seriesId: short.seriesId,
      title: short.title,
      tags: short.tags ?? [],
      videoUrl: this.filesService.getPublicUrl(short.videoKey),
      creatorName: short.creatorName,
    }));

    return {
      week: {
        start: week.start.toISOString(),
        end: week.end.toISOString(),
      },
      summary: {
        savedCount,
        totalDragCount,
        interestFieldCount,
      },
      frequentExpressions,
      recentExpressions,
      fieldStats,
      relatedShorts,
    };
  }
}

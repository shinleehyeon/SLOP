import { Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

export type RecordDragInput = {
  userId: string;
  normalizedKey: string;
  title: string;
  definition: string;
  sourceTitle: string | null;
  sourceUrl: string | null;
  fieldId: string | null;
  originalText: string;
  content: string;
};

@Injectable()
export class ExpressionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  recordDrag(input: RecordDragInput) {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const expression = await tx.expression.upsert({
        where: {
          userId_normalizedKey: {
            userId: input.userId,
            normalizedKey: input.normalizedKey,
          },
        },
        create: {
          userId: input.userId,
          title: input.title,
          definition: input.definition,
          sourceTitle: input.sourceTitle,
          sourceUrl: input.sourceUrl,
          fieldId: input.fieldId,
          normalizedKey: input.normalizedKey,
          dragCount: 1,
          firstDraggedAt: now,
          lastDraggedAt: now,
          savedAt: now,
        },
        update: {
          title: input.title,
          definition: input.definition,
          sourceTitle: input.sourceTitle,
          sourceUrl: input.sourceUrl,
          fieldId: input.fieldId ?? undefined,
          dragCount: { increment: 1 },
          lastDraggedAt: now,
        },
      });

      await tx.expressionDrag.create({
        data: {
          expressionId: expression.id,
          userId: input.userId,
          originalText: input.originalText,
          content: input.content,
          createdAt: now,
        },
      });

      return expression;
    });
  }

  countDragsInRange(userId: string, start: Date, end: Date) {
    return this.prisma.expressionDrag.count({
      where: {
        userId,
        createdAt: { gte: start, lte: end },
      },
    });
  }

  countExpressionsFirstDraggedInRange(userId: string, start: Date, end: Date) {
    return this.prisma.expression.count({
      where: {
        userId,
        firstDraggedAt: { gte: start, lte: end },
      },
    });
  }

  countUserInterestFields(userId: string) {
    return this.prisma.userFieldChoice.count({
      where: { userId },
    });
  }

  async findFrequentInRange(userId: string, start: Date, end: Date, limit: number) {
    const dragGroups = await this.prisma.expressionDrag.groupBy({
      by: ['expressionId'],
      where: {
        userId,
        createdAt: { gte: start, lte: end },
      },
      _count: { _all: true },
    });

    if (dragGroups.length === 0) {
      return [];
    }

    const weekDragCountById = new Map(
      dragGroups.map((group) => [group.expressionId, group._count._all]),
    );

    const topIds = [...dragGroups]
      .sort((left, right) => right._count._all - left._count._all)
      .slice(0, limit)
      .map((group) => group.expressionId);

    const expressions = await this.prisma.expression.findMany({
      where: { id: { in: topIds } },
      include: {
        field: { select: { name: true } },
      },
    });

    const byId = new Map(expressions.map((expression) => [expression.id, expression]));

    return topIds
      .map((id) => {
        const expression = byId.get(id);
        if (!expression) {
          return null;
        }
        return {
          ...expression,
          weekDragCount: weekDragCountById.get(id) ?? 0,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }

  findRecent(userId: string, limit: number) {
    return this.prisma.expression.findMany({
      where: { userId },
      include: {
        field: { select: { name: true } },
      },
      orderBy: { savedAt: 'desc' },
      take: limit,
    });
  }

  async fieldStatsInRange(userId: string, start: Date, end: Date) {
    const choices = await this.prisma.userFieldChoice.findMany({
      where: { userId },
      include: { field: true },
      orderBy: { createdAt: 'asc' },
    });

    if (choices.length === 0) {
      return [];
    }

    const fieldIds = choices.map((choice) => choice.fieldId);

    const expressionGroups = await this.prisma.expression.groupBy({
      by: ['fieldId'],
      where: {
        userId,
        fieldId: { in: fieldIds },
      },
      _count: { _all: true },
    });

    const dragGroups = await this.prisma.expressionDrag.groupBy({
      by: ['expressionId'],
      where: {
        userId,
        createdAt: { gte: start, lte: end },
        expression: {
          fieldId: { in: fieldIds },
        },
      },
      _count: { _all: true },
    });

    const expressionIds = dragGroups.map((group) => group.expressionId);
    const expressions =
      expressionIds.length === 0
        ? []
        : await this.prisma.expression.findMany({
            where: { id: { in: expressionIds } },
            select: { id: true, fieldId: true },
          });

    const fieldIdByExpressionId = new Map(
      expressions.map((expression) => [expression.id, expression.fieldId]),
    );

    const dragCountByFieldId = new Map<string, number>();
    for (const group of dragGroups) {
      const fieldId = fieldIdByExpressionId.get(group.expressionId);
      if (!fieldId) {
        continue;
      }
      dragCountByFieldId.set(fieldId, (dragCountByFieldId.get(fieldId) ?? 0) + group._count._all);
    }

    const expressionCountByFieldId = new Map(
      expressionGroups
        .filter((group): group is typeof group & { fieldId: string } => group.fieldId !== null)
        .map((group) => [group.fieldId, group._count._all]),
    );

    const rows = choices.map((choice) => ({
      fieldId: choice.fieldId,
      fieldName: choice.field.name,
      expressionCount: expressionCountByFieldId.get(choice.fieldId) ?? 0,
      dragCount: dragCountByFieldId.get(choice.fieldId) ?? 0,
    }));

    const maxDrag = Math.max(0, ...rows.map((row) => row.dragCount));

    return rows.map((row) => ({
      ...row,
      percentage: maxDrag === 0 ? 0 : Math.round((row.dragCount / maxDrag) * 100),
    }));
  }

  findRandomShorts(limit: number) {
    return this.prisma.$queryRaw<
      Array<{
        shortId: string;
        seriesId: string;
        title: string;
        tags: string[];
        videoKey: string;
        creatorName: string | null;
      }>
    >(Prisma.sql`
      SELECT
        s.id AS "shortId",
        s."seriesId" AS "seriesId",
        s.title AS "title",
        s.tags AS "tags",
        f.key AS "videoKey",
        u.name AS "creatorName"
      FROM shorts s
      INNER JOIN short_series ss ON ss.id = s."seriesId"
      INNER JOIN users u ON u.id = ss."userId"
      INNER JOIN files f ON f.id = s."videoFileId"
      ORDER BY RANDOM()
      LIMIT ${limit}
    `);
  }
}

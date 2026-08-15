import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRecommendedUsers(limit: number, excludeUserId?: string) {
    return this.prisma.user.findMany({
      where: excludeUserId
        ? {
            id: { not: excludeUserId },
          }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: {
          select: { key: true },
        },
        fieldChoices: {
          select: {
            field: { select: { name: true } },
          },
          take: 3,
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            shortSeries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findLatestShorts(limit: number) {
    return this.prisma.short.findMany({
      select: {
        id: true,
        seriesId: true,
        title: true,
        tags: true,
        createdAt: true,
        videoFile: {
          select: { key: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        series: {
          select: {
            title: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findLikedShortIds(userId: string, shortIds: string[]) {
    if (shortIds.length === 0) {
      return Promise.resolve([] as string[]);
    }

    return this.prisma.shortLike
      .findMany({
        where: {
          userId,
          shortId: { in: shortIds },
        },
        select: { shortId: true },
      })
      .then((rows) => rows.map((row) => row.shortId));
  }
}

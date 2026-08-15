import { Injectable } from '@nestjs/common';
import type { ShortGenerationStatus, ShortsStyle } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

interface CreateShortInput {
  episodeNumber: number;
  title: string;
  tags: string[];
  videoFileId: string;
}

interface CreateSeriesWithShortsInput {
  userId: string;
  title: string;
  style: ShortsStyle;
  requestedSiteUrl: string | null;
  shorts: CreateShortInput[];
  generationRequestId?: string;
}

interface CreateGenerationRequestInput {
  userId: string;
  requestedSiteUrl: string | null;
  content: string | null;
  links: string[];
  attachmentFileIds: string[];
  status: ShortGenerationStatus;
}

const shortWithEngagementInclude = {
  videoFile: true,
  _count: {
    select: {
      likes: true,
      comments: true,
    },
  },
} as const;

@Injectable()
export class ShortsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createSeriesWithShorts(input: CreateSeriesWithShortsInput) {
    return this.prisma.$transaction(async (tx) => {
      const series = await tx.shortSeries.create({
        data: {
          userId: input.userId,
          title: input.title,
          style: input.style,
          requestedSiteUrl: input.requestedSiteUrl,
          shorts: {
            create: input.shorts.map((short) => ({
              episodeNumber: short.episodeNumber,
              title: short.title,
              tags: short.tags,
              videoFileId: short.videoFileId,
            })),
          },
        },
        include: {
          shorts: {
            include: shortWithEngagementInclude,
            orderBy: {
              episodeNumber: 'asc',
            },
          },
        },
      });

      if (input.generationRequestId) {
        await tx.shortGenerationRequest.update({
          where: {
            id: input.generationRequestId,
          },
          data: {
            status: 'COMPLETED',
            seriesId: series.id,
            errorMessage: null,
          },
        });
      }

      return series;
    });
  }

  createGenerationRequest(input: CreateGenerationRequestInput) {
    return this.prisma.shortGenerationRequest.create({
      data: {
        userId: input.userId,
        requestedSiteUrl: input.requestedSiteUrl,
        content: input.content,
        links: input.links,
        attachmentFileIds: input.attachmentFileIds,
        status: input.status,
      },
    });
  }

  updateGenerationRequest(
    id: string,
    data: {
      status?: ShortGenerationStatus;
      aiJobId?: string | null;
      errorMessage?: string | null;
      seriesId?: string | null;
    },
  ) {
    return this.prisma.shortGenerationRequest.update({
      where: { id },
      data,
    });
  }

  findGenerationRequestById(id: string) {
    return this.prisma.shortGenerationRequest.findUnique({
      where: { id },
    });
  }

  findGenerationRequestByAiJobId(aiJobId: string) {
    return this.prisma.shortGenerationRequest.findFirst({
      where: { aiJobId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findVideoKeysByAiJobIds(aiJobIds: string[]) {
    if (aiJobIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.shortGenerationRequest.findMany({
      where: {
        aiJobId: { in: aiJobIds },
        seriesId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        aiJobId: true,
        series: {
          select: {
            shorts: {
              orderBy: { episodeNumber: 'asc' },
              take: 1,
              select: {
                videoFile: {
                  select: { key: true },
                },
              },
            },
          },
        },
      },
    });
  }

  listGenerationRequests(userId: string, status?: ShortGenerationStatus) {
    return this.prisma.shortGenerationRequest.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  listSeriesByUserId(userId: string) {
    return this.prisma.shortSeries.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { shorts: true },
        },
      },
    });
  }

  listShorts(input: { userId?: string; skip: number; take: number }) {
    const where = input.userId ? { series: { userId: input.userId } } : {};

    return this.prisma.short.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: input.skip,
      take: input.take,
      include: {
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
            id: true,
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
    });
  }

  countShorts(userId?: string) {
    return this.prisma.short.count({
      where: userId ? { series: { userId } } : undefined,
    });
  }

  findSeriesById(seriesId: string) {
    return this.prisma.shortSeries.findUnique({
      where: { id: seriesId },
      include: {
        shorts: {
          include: shortWithEngagementInclude,
          orderBy: {
            episodeNumber: 'asc',
          },
        },
      },
    });
  }

  findShortById(shortId: string) {
    return this.prisma.short.findUnique({
      where: { id: shortId },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
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

  findLike(shortId: string, userId: string) {
    return this.prisma.shortLike.findUnique({
      where: {
        shortId_userId: { shortId, userId },
      },
    });
  }

  createLike(shortId: string, userId: string) {
    return this.prisma.shortLike.create({
      data: { shortId, userId },
    });
  }

  deleteLike(shortId: string, userId: string) {
    return this.prisma.shortLike.delete({
      where: {
        shortId_userId: { shortId, userId },
      },
    });
  }

  countLikes(shortId: string) {
    return this.prisma.shortLike.count({
      where: { shortId },
    });
  }

  createComment(shortId: string, userId: string, content: string) {
    return this.prisma.shortComment.create({
      data: { shortId, userId, content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: {
              select: { key: true },
            },
          },
        },
      },
    });
  }

  listComments(shortId: string, skip: number, take: number) {
    return this.prisma.shortComment.findMany({
      where: { shortId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: {
              select: { key: true },
            },
          },
        },
      },
    });
  }

  countComments(shortId: string) {
    return this.prisma.shortComment.count({
      where: { shortId },
    });
  }

  findCommentById(commentId: string) {
    return this.prisma.shortComment.findUnique({
      where: { id: commentId },
    });
  }

  deleteComment(commentId: string) {
    return this.prisma.shortComment.delete({
      where: { id: commentId },
    });
  }
}

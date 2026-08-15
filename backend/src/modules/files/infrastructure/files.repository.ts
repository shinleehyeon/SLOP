import { Injectable } from '@nestjs/common';
import {
  buildFiltersWhere,
  buildOrderBy,
  buildTextQueryWhere,
  combineWhere,
  containsWhereAny,
  type ResolvedListQuery,
  stringContainsFilter,
} from '@/common/list-query';
import { normalizeStoredText } from '@/common/text/normalize-text';
import { FilePurpose, FileStatus } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { ListAdminFilesFilters } from '@/modules/admin/presentation/dto/admin-list-files.dto';

const fileRelationUserSelect = {
  id: true,
  name: true,
  email: true,
  profileImage: {
    select: {
      key: true,
    },
  },
} as const;

interface CreatePendingFileInput {
  purpose: FilePurpose;
  key: string;
  originalName?: string;
  contentType: string;
  size: number;
  ownerId?: string;
  uploadTokenHash?: string;
  expiresAt: Date;
}

interface MarkTemporaryInput {
  fileId: string;
  contentType: string;
  size: number;
}

interface AttachFileInput {
  fileId: string;
  ownerId: string;
  key: string;
}

@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPending(input: CreatePendingFileInput) {
    return this.prisma.file.create({
      data: {
        status: FileStatus.PENDING,
        purpose: input.purpose,
        key: input.key,
        originalName: input.originalName
          ? normalizeStoredText(input.originalName)
          : input.originalName,
        contentType: input.contentType,
        size: BigInt(input.size),
        ownerId: input.ownerId,
        uploadTokenHash: input.uploadTokenHash,
        expiresAt: input.expiresAt,
      },
    });
  }

  findById(fileId: string) {
    return this.prisma.file.findUnique({
      where: {
        id: fileId,
      },
    });
  }

  findByIdWithRelations(fileId: string) {
    return this.prisma.file.findUnique({
      where: {
        id: fileId,
      },
      include: {
        owner: {
          select: fileRelationUserSelect,
        },
        profileImageOf: {
          select: fileRelationUserSelect,
        },
      },
    });
  }

  findByOwnerId(ownerId: string) {
    return this.prisma.file.findMany({
      where: {
        ownerId,
      },
    });
  }

  findManyPaginated(input: { listQuery: ResolvedListQuery<ListAdminFilesFilters> }) {
    const { listQuery } = input;
    const where = combineWhere(
      buildTextQueryWhere(listQuery.query, (query) =>
        containsWhereAny([['originalName'], ['owner', 'name']], query),
      ),
      buildFiltersWhere(listQuery.filters, listQuery.filterMatch, {
        originalName: stringContainsFilter('originalName'),
        imagesOnly: (value) => (value ? { contentType: { startsWith: 'image/' } } : {}),
      }),
    );

    return Promise.all([
      this.prisma.file.findMany({
        where,
        orderBy: buildOrderBy(listQuery.sort),
        skip: listQuery.offset,
        take: listQuery.limit,
        include: {
          owner: {
            select: fileRelationUserSelect,
          },
          profileImageOf: {
            select: fileRelationUserSelect,
          },
        },
      }),
      this.prisma.file.count({ where }),
    ]).then(([items, total]) => ({ items, total }));
  }

  findExpiredTemporaryFiles(now: Date, limit: number) {
    return this.prisma.file.findMany({
      where: {
        status: {
          in: [FileStatus.PENDING, FileStatus.TEMPORARY],
        },
        expiresAt: {
          lt: now,
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
      take: limit,
    });
  }

  markTemporary(input: MarkTemporaryInput) {
    return this.prisma.file.update({
      where: {
        id: input.fileId,
      },
      data: {
        status: FileStatus.TEMPORARY,
        contentType: input.contentType,
        size: BigInt(input.size),
      },
    });
  }

  attach(input: AttachFileInput) {
    return this.prisma.file.update({
      where: {
        id: input.fileId,
      },
      data: {
        status: FileStatus.ATTACHED,
        key: input.key,
        ownerId: input.ownerId,
        uploadTokenHash: null,
        expiresAt: null,
        attachedAt: new Date(),
      },
    });
  }

  deleteById(fileId: string) {
    return this.prisma.file.delete({
      where: {
        id: fileId,
      },
    });
  }
}

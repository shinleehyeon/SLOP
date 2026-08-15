import { Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { IFilterPermission } from 'nestjs-rbac';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RBAC_ROLES } from '../rbac.permissions';

@Injectable()
export class FileOwnerFilter implements IFilterPermission {
  constructor(private readonly prisma: PrismaService) {}

  async canAsync(params?: unknown[]) {
    const request = (Array.isArray(params) ? params[0] : params) as Request | undefined;
    const user = request?.user;

    if (!user) {
      return false;
    }

    if (user.role === RBAC_ROLES.admin) {
      return true;
    }

    const fileId = request?.params?.fileId;
    if (typeof fileId === 'string') {
      return this.isOwner(user.id, fileId);
    }

    const fileIds = (request?.body as { fileIds?: string[] } | undefined)?.fileIds;
    if (Array.isArray(fileIds) && fileIds.length > 0) {
      return this.areAllOwned(user.id, fileIds);
    }

    return true;
  }

  private async isOwner(userId: string, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: { ownerId: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file.ownerId === userId;
  }

  private async areAllOwned(userId: string, fileIds: string[]) {
    const files = await this.prisma.file.findMany({
      where: { id: { in: fileIds } },
      select: { id: true, ownerId: true },
    });

    if (files.length !== fileIds.length) {
      throw new NotFoundException('File not found');
    }

    return files.every((file) => file.ownerId === userId);
  }
}

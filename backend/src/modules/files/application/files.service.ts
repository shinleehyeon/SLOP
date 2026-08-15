import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createId } from '@paralleldrive/cuid2';
import { createPaginationMeta } from '@/common/dto/pagination.dto';
import { resolveListQuery } from '@/common/list-query';
import { FilePurpose, FileStatus, OAuthProvider } from '@/generated/prisma/client';
import {
  ADMIN_FILES_LIST_QUERY_CONFIG,
  AdminListFilesQueryDto,
} from '@/modules/admin/presentation/dto/admin-list-files.dto';
import { AUDIT_LOG_ACTIONS } from '@/modules/audit-log/application/audit-log.actions';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { FilesRepository } from '../infrastructure/files.repository';
import { S3StorageService } from '../infrastructure/s3-storage.service';
import { CreatePresignedUploadRequestDto } from '../presentation/dto/create-presigned-upload.dto';
import { FileDirectory } from './file-directory.enum';
import { FILE_PURPOSE_POLICIES, normalizeContentType } from './file-purpose-policy';
import { fetchProfileImageFromUrl } from './profile-image-fetch';

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'application/json': 'json',
  'application/msword': 'doc',
  'application/pdf': 'pdf',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/x-7z-compressed': '7z',
  'application/x-rar-compressed': 'rar',
  'application/x-tar': 'tar',
  'application/x-zip-compressed': 'zip',
  'application/zip': 'zip',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'text/csv': 'csv',
  'text/markdown': 'md',
  'text/plain': 'txt',
};

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly publicUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly filesRepository: FilesRepository,
    private readonly storageService: S3StorageService,
    private readonly auditLogService: AuditLogService,
  ) {
    this.publicUrl = this.configService.getOrThrow<string>('storage.s3.publicUrl');
  }

  createOwnedPresignedUpload(userId: string, dto: CreatePresignedUploadRequestDto) {
    return this.createPresignedUpload(dto, {
      ownerId: userId || undefined,
    });
  }

  createAdminPresignedUpload(dto: CreatePresignedUploadRequestDto, ownerId?: string) {
    return this.createPresignedUpload(dto, {
      ownerId,
    });
  }

  async completeAdminUpload(fileId: string, actorId: string) {
    const file = await this.getFileOrThrow(fileId);
    const completedFile = await this.completeUpload(fileId);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.fileUploadCompleted,
      actorId,
      targetType: 'file',
      targetId: fileId,
      metadata: {
        purpose: completedFile.purpose,
        ownerId: file.ownerId,
        admin: true,
      },
    });

    return completedFile;
  }

  createOwnedBulkPresignedUpload(userId: string, dtos: CreatePresignedUploadRequestDto[]) {
    return this.createBulkPresignedUpload(dtos, { ownerId: userId || undefined });
  }

  createAdminBulkPresignedUpload(dtos: CreatePresignedUploadRequestDto[], ownerId?: string) {
    return this.createBulkPresignedUpload(dtos, { ownerId });
  }

  completeOwnedBulkUpload(userId: string, fileIds: string[]) {
    return this.collectBulkOperationResults(
      fileIds.map((fileId) => ({
        key: fileId,
        run: () => this.completeOwnedUpload(userId, fileId),
      })),
    );
  }

  completeAdminBulkUpload(actorId: string, fileIds: string[]) {
    return this.collectBulkOperationResults(
      fileIds.map((fileId) => ({
        key: fileId,
        run: () => this.completeAdminUpload(fileId, actorId),
      })),
    );
  }

  async deleteAdminBulkUpload(actorId: string, fileIds: string[]) {
    const result = await this.collectBulkOperationResults(
      fileIds.map((fileId) => ({
        key: fileId,
        run: async () => {
          const file = await this.removeAdminFile(fileId);
          return { id: file.id };
        },
      })),
    );

    if (result.items.length > 0 || result.failures.length > 0) {
      this.auditLogService.record({
        action: AUDIT_LOG_ACTIONS.fileBulkDeleted,
        actorId,
        targetType: 'file',
        metadata: {
          admin: true,
          deletedCount: result.items.length,
          fileIds: result.items.map((item) => item.id),
          failures: result.failures,
        },
      });
    }

    return {
      deletedCount: result.items.length,
      failures: result.failures,
    };
  }

  async createAnonymousPresignedUpload(dto: CreatePresignedUploadRequestDto) {
    const uploadToken = randomBytes(32).toString('base64url');
    const result = await this.createPresignedUpload(dto, {
      uploadTokenHash: this.hashUploadToken(uploadToken),
    });

    return {
      ...result,
      uploadToken,
    };
  }

  async completeOwnedUpload(userId: string, fileId: string) {
    await this.getFileOrThrow(fileId);

    const completedFile = await this.completeUpload(fileId);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.fileUploadCompleted,
      actorId: userId,
      targetType: 'file',
      targetId: fileId,
      metadata: {
        purpose: completedFile.purpose,
        anonymous: false,
      },
    });

    return completedFile;
  }

  async completeAnonymousUpload(fileId: string, uploadToken: string) {
    const file = await this.getFileOrThrow(fileId);

    if (file.ownerId || !file.uploadTokenHash) {
      throw new ForbiddenException('File cannot be completed with an upload token');
    }

    if (file.uploadTokenHash !== this.hashUploadToken(uploadToken)) {
      throw new ForbiddenException('Invalid upload token');
    }

    const completedFile = await this.completeUpload(fileId);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.fileUploadCompleted,
      targetType: 'file',
      targetId: fileId,
      metadata: {
        purpose: completedFile.purpose,
        anonymous: true,
      },
    });

    return completedFile;
  }

  async attachAnonymousFile(input: {
    fileId: string;
    uploadToken: string;
    ownerId: string;
    expectedPurpose: FilePurpose;
    destinationDirectory: string;
  }) {
    const destinationDirectory = this.normalizeDestinationDirectory(input.destinationDirectory);
    const file = await this.getFileOrThrow(input.fileId);

    if (file.purpose !== input.expectedPurpose) {
      throw new BadRequestException('File purpose does not match');
    }

    if (file.status !== FileStatus.TEMPORARY) {
      throw new BadRequestException('File upload has not been completed');
    }

    if (file.ownerId || !file.uploadTokenHash) {
      throw new ForbiddenException('File cannot be attached with an upload token');
    }

    if (file.uploadTokenHash !== this.hashUploadToken(input.uploadToken)) {
      throw new ForbiddenException('Invalid upload token');
    }

    return this.attachFileToDirectory({
      file,
      ownerId: input.ownerId,
      destinationDirectory,
    });
  }

  async attachOwnedFile(input: {
    fileId: string;
    ownerId: string;
    expectedPurpose: FilePurpose;
    destinationDirectory: string;
    /** AI 콜백처럼 소유자 없이 올린 TEMPORARY 파일을 시리즈 소유자에게 붙일 때 */
    allowUnowned?: boolean;
  }) {
    const destinationDirectory = this.normalizeDestinationDirectory(input.destinationDirectory);
    const file = await this.getFileOrThrow(input.fileId);

    const ownerMatches = file.ownerId === input.ownerId;
    const unownedAllowed = Boolean(input.allowUnowned) && file.ownerId == null;

    if (!ownerMatches && !unownedAllowed) {
      throw new ForbiddenException('File does not belong to the current user');
    }

    if (file.purpose !== input.expectedPurpose) {
      throw new BadRequestException('File purpose does not match');
    }

    if (file.status !== FileStatus.TEMPORARY) {
      throw new BadRequestException('File upload has not been completed');
    }

    return this.attachFileToDirectory({
      file,
      ownerId: input.ownerId,
      destinationDirectory,
    });
  }

  getPublicUrl(key: string) {
    return `${this.publicUrl.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }

  async getOwnedTemporaryGeneralFile(fileId: string, ownerId: string) {
    const file = await this.getFileOrThrow(fileId);

    if (file.ownerId !== ownerId) {
      throw new ForbiddenException('File does not belong to the current user');
    }

    if (file.purpose !== FilePurpose.GENERAL) {
      throw new BadRequestException('File purpose must be GENERAL');
    }

    if (file.status !== FileStatus.TEMPORARY) {
      throw new BadRequestException('File upload has not been completed');
    }

    return file;
  }

  async importProfileImageFromUrl(userId: string, pictureUrl: string, provider: OAuthProvider) {
    let pendingFileId: string | undefined;
    let tempKey: string | undefined;

    try {
      const fetched = await fetchProfileImageFromUrl(pictureUrl);
      const { storageFileName, originalName } = this.buildOAuthProfileImageName(
        userId,
        provider,
        fetched.contentType,
      );
      tempKey = this.buildTemporaryKey(storageFileName, fetched.contentType);

      await this.storageService.putObject({
        key: tempKey,
        body: fetched.buffer,
        contentType: fetched.contentType,
      });

      const file = await this.filesRepository.createPending({
        purpose: FilePurpose.PROFILE_IMAGE,
        key: tempKey,
        originalName,
        contentType: fetched.contentType,
        size: fetched.size,
        ownerId: userId,
        expiresAt: this.getTemporaryFileExpiresAt(),
      });
      pendingFileId = file.id;

      await this.filesRepository.markTemporary({
        fileId: file.id,
        contentType: fetched.contentType,
        size: fetched.size,
      });

      const attached = await this.attachOwnedFile({
        fileId: file.id,
        ownerId: userId,
        expectedPurpose: FilePurpose.PROFILE_IMAGE,
        destinationDirectory: FileDirectory.PROFILE_IMAGE,
      });

      return attached.id;
    } catch (error) {
      if (tempKey) {
        await this.storageService.deleteObject(tempKey).catch(() => undefined);
      }

      if (pendingFileId) {
        await this.filesRepository.deleteById(pendingFileId).catch(() => undefined);
      }

      this.logger.warn(
        `Failed to import OAuth profile image for user ${userId}: ${this.formatImportError(error)}`,
      );

      return null;
    }
  }

  async listFiles(query: AdminListFilesQueryDto) {
    const listQuery = resolveListQuery(query, ADMIN_FILES_LIST_QUERY_CONFIG);
    const { items, total } = await this.filesRepository.findManyPaginated({ listQuery });

    return {
      items: items.map((file) => this.serializeAdminFile(file)),
      meta: createPaginationMeta({
        page: query.page,
        limit: query.limit,
        total,
      }),
    };
  }

  async getAdminFile(fileId: string) {
    const file = await this.filesRepository.findByIdWithRelations(fileId);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.serializeAdminFile(file);
  }

  async deleteAdminFile(fileId: string, actorId: string) {
    const file = await this.removeAdminFile(fileId);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.fileDeleted,
      actorId,
      targetType: 'file',
      targetId: file.id,
      metadata: {
        purpose: file.purpose,
        ownerId: file.ownerId,
        admin: true,
      },
    });

    return { success: true as const };
  }

  private async removeAdminFile(fileId: string) {
    const file = await this.getFileOrThrow(fileId);

    await this.storageService.deleteObject(file.key);
    await this.filesRepository.deleteById(file.id);

    return file;
  }

  async deleteOwnedFile(fileId: string, ownerId: string) {
    const file = await this.getFileOrThrow(fileId);

    if (file.ownerId !== ownerId) {
      throw new ForbiddenException('File does not belong to the current user');
    }

    await this.storageService.deleteObject(file.key);
    await this.filesRepository.deleteById(file.id);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.fileDeleted,
      actorId: ownerId,
      targetType: 'file',
      targetId: file.id,
      metadata: {
        purpose: file.purpose,
      },
    });
  }

  async deleteOwnedObjects(ownerId: string) {
    const keys = await this.getOwnedObjectKeys(ownerId);

    await this.deleteObjects(keys);
  }

  async getOwnedObjectKeys(ownerId: string) {
    const files = await this.filesRepository.findByOwnerId(ownerId);

    return files.map((file) => file.key);
  }

  async deleteObjects(keys: string[]) {
    await Promise.allSettled(keys.map((key) => this.storageService.deleteObject(key)));
  }

  private async attachFileToDirectory(input: {
    file: Awaited<ReturnType<FilesRepository['findById']>>;
    ownerId: string;
    destinationDirectory: string;
  }) {
    if (!input.file) {
      throw new NotFoundException('File not found');
    }

    const destinationKey = this.buildAttachedKey({
      directory: input.destinationDirectory,
      ownerId: input.ownerId,
      storageFileName: this.getStorageFileName(input.file.key),
    });

    await this.storageService.copyObject(input.file.key, destinationKey);
    const attachedFile = await this.attachCopiedFile(input.file.id, input.ownerId, destinationKey);
    await this.storageService.deleteObject(input.file.key).catch(() => undefined);

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.fileAttached,
      actorId: input.ownerId,
      targetType: 'file',
      targetId: attachedFile.id,
      metadata: {
        purpose: attachedFile.purpose,
        destinationDirectory: input.destinationDirectory,
      },
    });

    return this.serializeFile(attachedFile);
  }

  private async createBulkPresignedUpload(
    dtos: CreatePresignedUploadRequestDto[],
    options: {
      ownerId?: string;
    },
  ) {
    const items = await Promise.all(
      dtos.map((dto) => this.createPresignedUpload(dto, { ownerId: options.ownerId })),
    );

    return { items };
  }

  private async collectBulkOperationResults<T extends { id: string }>(
    operations: Array<{ key: string; run: () => Promise<T> }>,
  ) {
    const results = await Promise.allSettled(operations.map((operation) => operation.run()));

    const items: T[] = [];
    const failures: Array<{ fileId: string; message: string }> = [];

    results.forEach((result, index) => {
      const fileId = operations[index]?.key;

      if (!fileId) {
        return;
      }

      if (result.status === 'fulfilled') {
        items.push(result.value);
        return;
      }

      failures.push({
        fileId,
        message: this.getBulkOperationErrorMessage(result.reason),
      });
    });

    return { items, failures };
  }

  private getBulkOperationErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Operation failed';
  }

  private formatImportError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  private async createPresignedUpload(
    dto: CreatePresignedUploadRequestDto,
    options: {
      ownerId?: string;
      uploadTokenHash?: string;
    },
  ) {
    this.assertSupportedFile(dto);

    const storageFileName = createId();
    const contentType = normalizeContentType(dto.contentType);
    const key = this.buildTemporaryKey(storageFileName, contentType);
    const expiresAt = this.getTemporaryFileExpiresAt();

    const file = await this.filesRepository.createPending({
      purpose: dto.purpose as FilePurpose,
      key,
      originalName: dto.originalName,
      contentType,
      size: dto.size,
      ownerId: options.ownerId,
      uploadTokenHash: options.uploadTokenHash,
      expiresAt,
    });

    const uploadUrl = await this.storageService.createPresignedUploadUrl({
      key,
      contentType,
      expiresInSeconds: this.configService.getOrThrow<number>(
        'storage.s3.presignedUploadExpiresSeconds',
      ),
    });

    this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.fileUploadUrlCreated,
      actorId: options.ownerId,
      targetType: 'file',
      targetId: file.id,
      metadata: {
        purpose: file.purpose,
        size: Number(file.size),
        anonymous: !options.ownerId,
      },
    });

    return {
      fileId: file.id,
      uploadUrl,
      method: 'PUT' as const,
      headers: {
        'Content-Type': contentType,
      },
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async completeUpload(fileId: string) {
    const file = await this.getFileOrThrow(fileId);

    if (file.status !== FileStatus.PENDING) {
      throw new BadRequestException('File upload is not pending');
    }

    const metadata = await this.storageService.getObjectMetadata(file.key);

    if (metadata.contentLength !== Number(file.size)) {
      throw new BadRequestException('Uploaded file size does not match');
    }

    if (metadata.contentType && normalizeContentType(metadata.contentType) !== file.contentType) {
      throw new BadRequestException('Uploaded file content type does not match');
    }

    const temporaryFile = await this.filesRepository.markTemporary({
      fileId: file.id,
      contentType: file.contentType,
      size: Number(file.size),
    });

    return this.serializeFile(temporaryFile);
  }

  private async getFileOrThrow(fileId: string) {
    const file = await this.filesRepository.findById(fileId);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  private assertSupportedFile(dto: CreatePresignedUploadRequestDto) {
    const contentType = normalizeContentType(dto.contentType);
    const policy = FILE_PURPOSE_POLICIES[dto.purpose as FilePurpose];

    if (!policy) {
      throw new BadRequestException('Unsupported file purpose');
    }

    if (!policy.matchesContentType(contentType)) {
      throw new BadRequestException('Unsupported file content type');
    }

    if (dto.size > policy.maxBytes) {
      throw new BadRequestException('File size exceeds the allowed limit');
    }
  }

  private buildTemporaryKey(storageFileName: string, contentType: string) {
    return `temp/${storageFileName}.${this.getExtension(contentType)}`;
  }

  private async attachCopiedFile(fileId: string, ownerId: string, destinationKey: string) {
    try {
      return await this.filesRepository.attach({
        fileId,
        ownerId,
        key: destinationKey,
      });
    } catch (error) {
      await this.storageService.deleteObject(destinationKey).catch(() => undefined);
      throw error;
    }
  }

  private buildAttachedKey(input: { directory: string; ownerId: string; storageFileName: string }) {
    return `${input.directory}/${input.ownerId}/${input.storageFileName}`;
  }

  private getStorageFileName(key: string) {
    const storageFileName = key.split('/').pop();

    if (!storageFileName) {
      throw new BadRequestException('Invalid file key');
    }

    return storageFileName;
  }

  private normalizeDestinationDirectory(directory: string) {
    const normalized = directory
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join('/');

    if (!normalized || normalized.includes('..')) {
      throw new BadRequestException('Invalid destination directory');
    }

    return normalized;
  }

  private getExtension(contentType: string) {
    return CONTENT_TYPE_EXTENSIONS[normalizeContentType(contentType)] ?? 'bin';
  }

  private buildOAuthProfileImageName(userId: string, provider: OAuthProvider, contentType: string) {
    const extension = this.getExtension(contentType);
    const providerSlug = provider.toLowerCase();
    const storageFileName = `${userId}_${providerSlug}_oauth_image`;

    return {
      storageFileName,
      originalName: `${storageFileName}.${extension}`,
    };
  }

  private getTemporaryFileExpiresAt() {
    const expiresHours = this.configService.getOrThrow<number>(
      'storage.s3.temporaryFileExpiresHours',
    );

    return new Date(Date.now() + expiresHours * 60 * 60 * 1000);
  }

  private hashUploadToken(uploadToken: string) {
    return createHash('sha256').update(uploadToken).digest('hex');
  }

  private serializeFile(file: {
    id: string;
    status: FileStatus;
    purpose: FilePurpose;
    key: string;
    originalName: string | null;
    contentType: string;
    size: bigint;
    ownerId: string | null;
    attachedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: file.id,
      status: file.status,
      purpose: file.purpose,
      key: file.key,
      publicUrl: this.getPublicUrl(file.key),
      originalName: file.originalName,
      contentType: file.contentType,
      size: Number(file.size),
      ownerId: file.ownerId,
      attachedAt: file.attachedAt?.toISOString() ?? null,
      expiresAt: file.expiresAt?.toISOString() ?? null,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    };
  }

  private serializeAdminFileUser(
    user: {
      id: string;
      name: string;
      email: string | null;
      profileImage?: { key: string } | null;
    } | null,
  ) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImage?.key ? this.getPublicUrl(user.profileImage.key) : null,
    };
  }

  private serializeAdminFile(
    file: Parameters<FilesService['serializeFileLink']>[0] & {
      id: string;
      purpose: FilePurpose;
      key: string;
      originalName: string | null;
      contentType: string;
      size: bigint;
      ownerId: string | null;
      attachedAt: Date | null;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      owner: {
        id: string;
        name: string;
        email: string | null;
        profileImage?: { key: string } | null;
      } | null;
    },
  ) {
    return {
      ...this.serializeFile(file),
      owner: this.serializeAdminFileUser(file.owner),
      ...this.serializeFileLink(file),
    };
  }

  private serializeFileLink(file: {
    status: FileStatus;
    purpose: FilePurpose;
    profileImageOf: {
      id: string;
      name: string;
      email: string | null;
      profileImage?: { key: string } | null;
    } | null;
  }) {
    if (file.profileImageOf) {
      const linkedUser = this.serializeAdminFileUser(file.profileImageOf);

      if (linkedUser) {
        return {
          isLinked: true,
          link: {
            type: 'profile_image' as const,
            user: linkedUser,
          },
        };
      }
    }

    return {
      isLinked: file.status === FileStatus.ATTACHED,
      link: null,
    };
  }
}

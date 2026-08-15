import { Injectable } from '@nestjs/common';
import { FilesService } from '@/modules/files/application/files.service';
import {
  BulkCompleteUploadRequestDto,
  BulkDeleteFilesRequestDto,
} from '@/modules/files/presentation/dto/bulk-file-upload.dto';
import { AdminBulkPresignedUploadRequestDto } from '../presentation/dto/admin-bulk-presigned-upload.dto';
import { AdminListFilesQueryDto } from '../presentation/dto/admin-list-files.dto';
import { AdminCreatePresignedUploadRequestDto } from '../presentation/dto/admin-presigned-upload.dto';

@Injectable()
export class AdminFilesService {
  constructor(private readonly filesService: FilesService) {}

  listFiles(query: AdminListFilesQueryDto) {
    return this.filesService.listFiles(query);
  }

  getFile(fileId: string) {
    return this.filesService.getAdminFile(fileId);
  }

  createPresignedUpload(_actorId: string, dto: AdminCreatePresignedUploadRequestDto) {
    const { ownerId, ...uploadDto } = dto;

    return this.filesService.createAdminPresignedUpload(uploadDto, ownerId);
  }

  createBulkPresignedUpload(_actorId: string, dto: AdminBulkPresignedUploadRequestDto) {
    const { ownerId, files } = dto;

    return this.filesService.createAdminBulkPresignedUpload(files, ownerId);
  }

  completeUpload(actorId: string, fileId: string) {
    return this.filesService.completeAdminUpload(fileId, actorId);
  }

  completeBulkUpload(actorId: string, dto: BulkCompleteUploadRequestDto) {
    return this.filesService.completeAdminBulkUpload(actorId, dto.fileIds);
  }

  deleteBulkUpload(actorId: string, dto: BulkDeleteFilesRequestDto) {
    return this.filesService.deleteAdminBulkUpload(actorId, dto.fileIds);
  }

  deleteFile(actorId: string, fileId: string) {
    return this.filesService.deleteAdminFile(fileId, actorId);
  }
}

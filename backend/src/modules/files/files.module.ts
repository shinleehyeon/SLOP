import { Module } from '@nestjs/common';
import { FilesService } from './application/files.service';
import { FilesCleanupService } from './application/files-cleanup.service';
import { FilesRepository } from './infrastructure/files.repository';
import { S3StorageService } from './infrastructure/s3-storage.service';
import { FilesController } from './presentation/files.controller';

@Module({
  controllers: [FilesController],
  providers: [FilesCleanupService, FilesService, FilesRepository, S3StorageService],
  exports: [FilesService],
})
export class FilesModule {}

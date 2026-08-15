import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FilesRepository } from '../infrastructure/files.repository';
import { S3StorageService } from '../infrastructure/s3-storage.service';

const CLEANUP_BATCH_SIZE = 100;

@Injectable()
export class FilesCleanupService {
  private readonly logger = new Logger(FilesCleanupService.name);

  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly storageService: S3StorageService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'files-expired-cleanup',
    waitForCompletion: true,
  })
  async cleanupExpiredTemporaryFiles() {
    const files = await this.filesRepository.findExpiredTemporaryFiles(
      new Date(),
      CLEANUP_BATCH_SIZE,
    );

    if (files.length === 0) {
      return;
    }

    let deletedCount = 0;

    for (const file of files) {
      try {
        await this.storageService.deleteObject(file.key);
        await this.filesRepository.deleteById(file.id);
        deletedCount += 1;
      } catch (error) {
        this.logger.warn(
          `Failed to cleanup expired file ${file.id} (${file.key}): ${this.formatError(error)}`,
        );
      }
    }

    this.logger.log(`Cleaned up ${deletedCount}/${files.length} expired temporary files`);
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}

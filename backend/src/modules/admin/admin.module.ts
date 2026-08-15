import { Module } from '@nestjs/common';
import { AuthCoreModule } from '@/modules/auth/auth-core.module';
import { FilesModule } from '@/modules/files/files.module';
import { HealthModule } from '@/modules/health/health.module';
import { UsersModule } from '@/modules/users/users.module';
import { AdminAuditLogsService } from './application/admin-audit-logs.service';
import { AdminFilesService } from './application/admin-files.service';
import { AdminUsersService } from './application/admin-users.service';
import { AdminAuditLogsController } from './presentation/admin-audit-logs.controller';
import { AdminFilesController } from './presentation/admin-files.controller';
import { AdminSystemMetricsController } from './presentation/admin-system-metrics.controller';
import { AdminUsersController } from './presentation/admin-users.controller';

@Module({
  imports: [AuthCoreModule, FilesModule, UsersModule, HealthModule],
  controllers: [
    AdminUsersController,
    AdminFilesController,
    AdminAuditLogsController,
    AdminSystemMetricsController,
  ],
  providers: [AdminUsersService, AdminFilesService, AdminAuditLogsService],
})
export class AdminModule {}

import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { ApiListQuery } from '@/common/decorators/api-list-query.decorator';
import { CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import {
  BulkCompleteUploadRequestDto,
  BulkCompleteUploadResponseDto,
  BulkDeleteFilesRequestDto,
  BulkDeleteFilesResponseDto,
  BulkPresignedUploadResponseDto,
} from '@/modules/files/presentation/dto/bulk-file-upload.dto';
import {
  FileResponseDto,
  PresignedUploadResponseDto,
} from '@/modules/files/presentation/dto/file-upload-response.dto';
import { AdminFilesService } from '../application/admin-files.service';
import { AdminBulkPresignedUploadRequestDto } from '../presentation/dto/admin-bulk-presigned-upload.dto';
import {
  AdminFileDetailResponseDto,
  AdminFileListResponseDto,
  AdminListFilesQueryDto,
  DeleteFileResponseDto,
} from '../presentation/dto/admin-list-files.dto';
import { AdminCreatePresignedUploadRequestDto } from '../presentation/dto/admin-presigned-upload.dto';

@Controller('admin/files')
@ApiController({
  tag: OPENAPI_TAGS.adminFiles,
  group: OPENAPI_GROUPS.admin,
  description: '관리자 파일 업로드 API',
})
export class AdminFilesController {
  constructor(private readonly adminFilesService: AdminFilesService) {}

  @Get()
  @RequirePermissions(RBAC.file.adminList)
  @ApiListQuery({
    filtersExample: '{"status":"ATTACHED","originalName":"profile","imagesOnly":true}',
    sortExample: '-createdAt',
  })
  @ApiEndpoint({
    title: '관리자 파일 목록 조회',
    description: '업로드된 파일 목록을 페이지네이션으로 조회합니다.',
    status: 200,
    response: AdminFileListResponseDto,
    errorStatuses: [401, 403],
  })
  listFiles(@Query() query: AdminListFilesQueryDto) {
    return this.adminFilesService.listFiles(query);
  }

  @Get(':fileId')
  @RequirePermissions(RBAC.file.adminList)
  @ApiEndpoint({
    title: '관리자 파일 상세 조회',
    description: '파일 ID로 상세 정보를 조회합니다.',
    status: 200,
    response: AdminFileDetailResponseDto,
    errorStatuses: [404],
  })
  getFile(@Param('fileId') fileId: string) {
    return this.adminFilesService.getFile(fileId);
  }

  @Post('presigned-upload/bulk')
  @RequirePermissions(RBAC.file.adminCreateUpload)
  @ApiEndpoint({
    title: '관리자 파일 bulk presigned URL 발급',
    description: '여러 파일의 presigned PUT URL을 한 번에 발급합니다.',
    status: 201,
    response: BulkPresignedUploadResponseDto,
    errorStatuses: [400, 401, 403],
  })
  createBulkPresignedUpload(
    @CurrentUserId() actorId: string,
    @Body() dto: AdminBulkPresignedUploadRequestDto,
  ) {
    return this.adminFilesService.createBulkPresignedUpload(actorId, dto);
  }

  @Post('presigned-upload')
  @RequirePermissions(RBAC.file.adminCreateUpload)
  @ApiEndpoint({
    title: '관리자 파일 업로드 URL 발급',
    description:
      '관리자가 presigned upload URL을 발급합니다. ownerId를 지정하면 해당 사용자 소유 파일로 생성됩니다.',
    status: 201,
    response: PresignedUploadResponseDto,
    errorStatuses: [400, 401, 403],
  })
  createPresignedUpload(
    @CurrentUserId() actorId: string,
    @Body() dto: AdminCreatePresignedUploadRequestDto,
  ) {
    return this.adminFilesService.createPresignedUpload(actorId, dto);
  }

  @Post('complete/bulk')
  @RequirePermissions(RBAC.file.adminComplete)
  @ApiEndpoint({
    title: '관리자 파일 bulk 업로드 완료',
    description: '여러 fileId의 S3/R2 업로드 완료 처리를 한 번에 수행합니다.',
    status: 200,
    response: BulkCompleteUploadResponseDto,
    errorStatuses: [400, 401, 403],
  })
  completeBulkUpload(@CurrentUserId() actorId: string, @Body() dto: BulkCompleteUploadRequestDto) {
    return this.adminFilesService.completeBulkUpload(actorId, dto);
  }

  @Post('delete/bulk')
  @RequirePermissions(RBAC.file.adminDelete)
  @ApiEndpoint({
    title: '관리자 파일 bulk 삭제',
    description: '여러 fileId의 파일 레코드와 S3/R2 object를 한 번에 삭제합니다.',
    status: 200,
    response: BulkDeleteFilesResponseDto,
    errorStatuses: [400, 401, 403],
  })
  deleteBulkUpload(@CurrentUserId() actorId: string, @Body() dto: BulkDeleteFilesRequestDto) {
    return this.adminFilesService.deleteBulkUpload(actorId, dto);
  }

  @Post(':fileId/complete')
  @RequirePermissions(RBAC.file.adminComplete)
  @ApiEndpoint({
    title: '관리자 파일 업로드 완료',
    description: '관리자가 소유자와 관계없이 파일 업로드 완료 처리를 수행합니다.',
    status: 200,
    response: FileResponseDto,
    errorStatuses: [400, 401, 403, 404],
  })
  completeUpload(@CurrentUserId() actorId: string, @Param('fileId') fileId: string) {
    return this.adminFilesService.completeUpload(actorId, fileId);
  }

  @Delete(':fileId')
  @RequirePermissions(RBAC.file.adminDelete)
  @ApiEndpoint({
    title: '관리자 파일 삭제',
    description: '파일 레코드와 S3/R2 object를 함께 삭제합니다.',
    status: 200,
    response: DeleteFileResponseDto,
    errorStatuses: [401, 403, 404],
  })
  deleteFile(@CurrentUserId() actorId: string, @Param('fileId') fileId: string) {
    return this.adminFilesService.deleteFile(actorId, fileId);
  }
}

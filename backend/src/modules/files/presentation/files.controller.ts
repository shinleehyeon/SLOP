import { Body, Controller, Param, Post } from '@nestjs/common';
import { AllowAiServiceAuth } from '@/common/decorators/allow-ai-service-auth.decorator';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { FilesService } from '../application/files.service';
import {
  BulkCompleteUploadRequestDto,
  BulkCompleteUploadResponseDto,
  BulkPresignedUploadRequestDto,
  BulkPresignedUploadResponseDto,
} from './dto/bulk-file-upload.dto';
import { CompleteAnonymousUploadRequestDto } from './dto/complete-upload.dto';
import { CreatePresignedUploadRequestDto } from './dto/create-presigned-upload.dto';
import {
  AnonymousPresignedUploadResponseDto,
  FileResponseDto,
  PresignedUploadResponseDto,
} from './dto/file-upload-response.dto';

@Controller('files')
@ApiController({
  tag: OPENAPI_TAGS.files,
  group: OPENAPI_GROUPS.application,
  description: 'Presigned 파일 업로드',
})
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presigned-upload/bulk')
  @AllowAiServiceAuth()
  @RequirePermissions(RBAC.file.createUpload)
  @ApiEndpoint({
    title: '인증 사용자 bulk presigned URL 발급',
    description:
      '여러 파일의 presigned PUT URL을 한 번에 발급합니다. AI 마이크로서비스는 X-AI-API-Key로 호출할 수 있습니다.',
    status: 201,
    response: BulkPresignedUploadResponseDto,
    errorStatuses: [400, 401],
  })
  createOwnedBulkPresignedUpload(
    @CurrentUserId() userId: string,
    @Body() dto: BulkPresignedUploadRequestDto,
  ) {
    return this.filesService.createOwnedBulkPresignedUpload(userId, dto.files);
  }

  @Post('presigned-upload')
  @AllowAiServiceAuth()
  @RequirePermissions(RBAC.file.createUpload)
  @ApiEndpoint({
    title: '인증 사용자 파일 업로드 URL 발급',
    description:
      '인증된 사용자 소유의 S3/R2 presigned PUT 업로드 URL을 발급합니다. 응답의 uploadUrl로 클라이언트가 파일을 직접 업로드한 뒤 complete API를 호출해야 합니다. AI 마이크로서비스는 X-AI-API-Key로 호출할 수 있습니다.',
    status: 201,
    response: PresignedUploadResponseDto,
    errorStatuses: [400, 401],
  })
  createOwnedPresignedUpload(
    @CurrentUserId() userId: string,
    @Body() dto: CreatePresignedUploadRequestDto,
  ) {
    return this.filesService.createOwnedPresignedUpload(userId, dto);
  }

  @Post('anonymous/presigned-upload')
  @ApiEndpoint({
    title: '익명 파일 업로드 URL 발급',
    description:
      '회원가입 전 사용할 수 있는 S3/R2 presigned PUT 업로드 URL과 uploadToken을 발급합니다. 회원가입 요청에서 profileImageId와 uploadToken을 함께 전달해 임시 파일 소유권을 증명합니다.',
    status: 201,
    response: AnonymousPresignedUploadResponseDto,
    errorStatuses: [400],
    isPublic: true,
  })
  createAnonymousPresignedUpload(@Body() dto: CreatePresignedUploadRequestDto) {
    return this.filesService.createAnonymousPresignedUpload(dto);
  }

  @Post('complete/bulk')
  @AllowAiServiceAuth()
  @RequirePermissions(RBAC.file.completeOwn)
  @ApiEndpoint({
    title: '인증 사용자 bulk 업로드 완료',
    description:
      '여러 fileId의 S3/R2 업로드 완료 처리를 한 번에 수행합니다. AI 마이크로서비스는 X-AI-API-Key로 호출할 수 있습니다.',
    status: 200,
    response: BulkCompleteUploadResponseDto,
    errorStatuses: [400, 401, 403],
  })
  completeOwnedBulkUpload(
    @CurrentUserId() userId: string,
    @Body() dto: BulkCompleteUploadRequestDto,
  ) {
    return this.filesService.completeOwnedBulkUpload(userId, dto.fileIds);
  }

  @Post(':fileId/complete')
  @AllowAiServiceAuth()
  @RequirePermissions(RBAC.file.completeOwn)
  @ApiEndpoint({
    title: '인증 사용자 파일 업로드 완료',
    description:
      'S3/R2 업로드 완료 여부를 HeadObject로 확인하고 파일 상태를 TEMPORARY로 변경합니다. 이후 도메인 API에서 fileId를 사용하면 ATTACHED로 이동됩니다. AI 마이크로서비스는 X-AI-API-Key로 호출할 수 있습니다.',
    status: 200,
    response: FileResponseDto,
    errorStatuses: [400, 401, 403, 404],
  })
  completeOwnedUpload(@CurrentUserId() userId: string, @Param('fileId') fileId: string) {
    return this.filesService.completeOwnedUpload(userId, fileId);
  }

  @Post('anonymous/:fileId/complete')
  @ApiEndpoint({
    title: '익명 파일 업로드 완료',
    description:
      'uploadToken으로 임시 소유권을 검증한 뒤 S3/R2 업로드 완료 여부를 확인하고 파일 상태를 TEMPORARY로 변경합니다.',
    status: 200,
    response: FileResponseDto,
    errorStatuses: [400, 403, 404],
    isPublic: true,
  })
  completeAnonymousUpload(
    @Param('fileId') fileId: string,
    @Body() dto: CompleteAnonymousUploadRequestDto,
  ) {
    return this.filesService.completeAnonymousUpload(fileId, dto.uploadToken);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { ApiListQuery } from '@/common/decorators/api-list-query.decorator';
import { CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { LogoutResponseDto } from '@/modules/auth/presentation/dto/auth-response.dto';
import { ListUsersQueryDto } from '@/modules/users/presentation/dto/list-users-query.dto';
import {
  DeleteUserResponseDto,
  UserListResponseDto,
} from '@/modules/users/presentation/dto/user-response.dto';
import { AdminUsersService } from '../application/admin-users.service';
import {
  BulkDeleteUsersRequestDto,
  BulkDeleteUsersResponseDto,
} from '../presentation/dto/admin-bulk-delete-users.dto';
import { AdminCreateUserRequestDto } from '../presentation/dto/admin-create-user.dto';
import {
  AdminOAuthProviderSchema,
  AdminUnlinkOAuthResponseDto,
} from '../presentation/dto/admin-oauth-provider.dto';
import {
  AdminResetPasswordRequestDto,
  AdminResetPasswordResponseDto,
} from '../presentation/dto/admin-reset-password.dto';
import { AdminUpdateUserRequestDto } from '../presentation/dto/admin-update-user.dto';
import {
  AdminUserDetailResponseDto,
  OAuthAccountListResponseDto,
} from '../presentation/dto/admin-user-response.dto';

@Controller('admin/users')
@ApiController({
  tag: OPENAPI_TAGS.adminUsers,
  group: OPENAPI_GROUPS.admin,
  description: '관리자 사용자 관리 API',
})
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @RequirePermissions(RBAC.user.list)
  @ApiListQuery({
    filtersExample: '{"role":"admin","name":"kim"}',
    sortExample: '-name',
  })
  @ApiEndpoint({
    title: '사용자 목록 조회',
    description: '관리자가 사용자 목록을 페이지네이션으로 조회합니다.',
    status: 200,
    response: UserListResponseDto,
  })
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminUsersService.listUsers(query);
  }

  @Post()
  @RequirePermissions(RBAC.user.create)
  @ApiEndpoint({
    title: '사용자 생성',
    description: '관리자가 비밀번호 기반 사용자 계정을 생성합니다. OAuth 연결은 포함되지 않습니다.',
    status: 201,
    response: AdminUserDetailResponseDto,
    errorStatuses: [400, 409],
  })
  createUser(@CurrentUserId() actorId: string, @Body() dto: AdminCreateUserRequestDto) {
    return this.adminUsersService.createUser(actorId, dto);
  }

  @Post('delete/bulk')
  @RequirePermissions(RBAC.user.delete)
  @ApiEndpoint({
    title: '사용자 bulk 삭제',
    description: '여러 사용자 계정과 소유 파일을 한 번에 삭제합니다.',
    status: 200,
    response: BulkDeleteUsersResponseDto,
    errorStatuses: [400],
  })
  deleteBulkUsers(@CurrentUserId() actorId: string, @Body() dto: BulkDeleteUsersRequestDto) {
    return this.adminUsersService.deleteBulkUsers(actorId, dto.userIds);
  }

  @Get(':userId')
  @RequirePermissions(RBAC.user.read)
  @ApiEndpoint({
    title: '사용자 상세 조회',
    description: '관리자가 사용자 상세 정보와 OAuth 연결 상태를 조회합니다.',
    status: 200,
    response: AdminUserDetailResponseDto,
    errorStatuses: [404],
  })
  getUser(@Param('userId') userId: string) {
    return this.adminUsersService.getUser(userId);
  }

  @Patch(':userId')
  @RequirePermissions(RBAC.user.update)
  @ApiEndpoint({
    title: '사용자 정보 수정',
    description: '관리자가 사용자 이름, 역할, 이메일, 전화번호, 프로필 이미지를 수정합니다.',
    status: 200,
    response: AdminUserDetailResponseDto,
    errorStatuses: [400, 404, 409],
  })
  updateUser(
    @CurrentUserId() actorId: string,
    @Param('userId') userId: string,
    @Body() dto: AdminUpdateUserRequestDto,
  ) {
    return this.adminUsersService.updateUser(actorId, userId, dto);
  }

  @Delete(':userId')
  @RequirePermissions(RBAC.user.delete)
  @ApiEndpoint({
    title: '사용자 삭제',
    description: '관리자가 사용자 계정과 소유 파일을 삭제합니다.',
    status: 200,
    response: DeleteUserResponseDto,
    errorStatuses: [400, 404],
  })
  deleteUser(@CurrentUserId() actorId: string, @Param('userId') userId: string) {
    return this.adminUsersService.deleteUser(actorId, userId);
  }

  @Post(':userId/password')
  @RequirePermissions(RBAC.user.resetPassword)
  @ApiEndpoint({
    title: '사용자 비밀번호 재설정',
    description: '관리자가 사용자 비밀번호를 재설정하고 모든 리프레시 토큰 세션을 무효화합니다.',
    status: 200,
    response: AdminResetPasswordResponseDto,
    errorStatuses: [400, 404],
  })
  resetPassword(
    @CurrentUserId() actorId: string,
    @Param('userId') userId: string,
    @Body() dto: AdminResetPasswordRequestDto,
  ) {
    return this.adminUsersService.resetPassword(actorId, userId, dto.newPassword);
  }

  @Post(':userId/logout-all')
  @RequirePermissions(RBAC.user.forceLogout)
  @ApiEndpoint({
    title: '사용자 전체 로그아웃',
    description: '관리자가 특정 사용자의 모든 리프레시 토큰 세션을 무효화합니다.',
    status: 200,
    response: LogoutResponseDto,
    errorStatuses: [404],
  })
  forceLogout(@CurrentUserId() actorId: string, @Param('userId') userId: string) {
    return this.adminUsersService.forceLogout(actorId, userId);
  }

  @Get(':userId/oauth-accounts')
  @RequirePermissions(RBAC.user.readOAuth)
  @ApiEndpoint({
    title: 'OAuth 연결 목록 조회',
    description: '관리자가 사용자에 연결된 Google/GitHub 계정 목록을 조회합니다.',
    status: 200,
    response: OAuthAccountListResponseDto,
    errorStatuses: [404],
  })
  listOAuthAccounts(@Param('userId') userId: string) {
    return this.adminUsersService.listOAuthAccounts(userId);
  }

  @Delete(':userId/oauth-accounts/:provider')
  @RequirePermissions(RBAC.user.unlinkOAuth)
  @ApiEndpoint({
    title: 'OAuth 연결 해제',
    description:
      '관리자가 사용자의 Google/GitHub 연결을 해제합니다. 유일한 로그인 수단이면 거부됩니다.',
    status: 200,
    response: AdminUnlinkOAuthResponseDto,
    errorStatuses: [400, 404],
  })
  unlinkOAuth(
    @CurrentUserId() actorId: string,
    @Param('userId') userId: string,
    @Param('provider') provider: string,
  ) {
    const parsedProvider = AdminOAuthProviderSchema.parse(provider);

    return this.adminUsersService.unlinkOAuth(actorId, userId, parsedProvider);
  }
}

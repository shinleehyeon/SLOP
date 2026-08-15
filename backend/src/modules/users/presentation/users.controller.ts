import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUserId } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { OAuthProviderSchema } from '@/common/dto/oauth-provider.dto';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { RBAC } from '@/infrastructure/rbac/rbac.permissions';
import { FileDirectory } from '@/modules/files/application/file-directory.enum';
import { UsersService } from '../application/users.service';
import { UpdateUserRequestDto } from './dto/update-user.dto';
import {
  DeleteUserResponseDto,
  MeResponseDto,
  UnlinkOAuthResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';

@Controller('users')
@ApiController({
  tag: OPENAPI_TAGS.users,
  group: OPENAPI_GROUPS.application,
  description: '내 프로필 조회·수정·탈퇴',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @RequirePermissions(RBAC.user.readSelf)
  @ApiEndpoint({
    title: '내 정보 조회',
    description: '인증된 사용자의 최신 프로필 정보를 조회합니다.',
    status: 200,
    response: MeResponseDto,
    errorStatuses: [401],
  })
  getMe(@CurrentUserId() userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @RequirePermissions(RBAC.user.updateSelf)
  @ApiEndpoint({
    title: '내 정보 수정',
    description: `인증된 사용자의 이름과 프로필 이미지를 수정합니다. profileImageId는 complete가 끝난 TEMPORARY 파일이어야 하며, 저장 시 ${FileDirectory.PROFILE_IMAGE} 폴더로 이동되고 기존 프로필 이미지는 정리됩니다.`,
    status: 200,
    response: UserResponseDto,
    errorStatuses: [400, 404],
  })
  updateMe(@CurrentUserId() userId: string, @Body() dto: UpdateUserRequestDto) {
    return this.usersService.updateMe(userId, dto);
  }

  @Delete('me/oauth-accounts/:provider')
  @RequirePermissions(RBAC.user.unlinkOAuthSelf)
  @ApiEndpoint({
    title: '내 OAuth 연결 해제',
    description: '인증된 사용자가 본인 OAuth 계정 연결을 해제합니다.',
    status: 200,
    response: UnlinkOAuthResponseDto,
    errorStatuses: [400, 404],
  })
  unlinkOAuthSelf(@CurrentUserId() userId: string, @Param('provider') provider: string) {
    const parsedProvider = OAuthProviderSchema.parse(provider);

    return this.usersService.unlinkOAuthSelf(userId, parsedProvider);
  }

  @Delete('me')
  @RequirePermissions(RBAC.user.deleteSelf)
  @ApiEndpoint({
    title: '회원 탈퇴',
    description: '인증된 사용자를 삭제하고 사용자가 소유한 파일 object를 정리합니다.',
    status: 200,
    response: DeleteUserResponseDto,
    errorStatuses: [401],
  })
  deleteMe(@CurrentUserId() userId: string) {
    return this.usersService.deleteMe(userId);
  }
}

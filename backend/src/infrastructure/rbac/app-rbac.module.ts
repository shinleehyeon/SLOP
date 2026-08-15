import { Global, Module } from '@nestjs/common';
import { ASYNC_RBAC_REQUEST_FILTER, IStorageRbac, RBAcModule } from 'nestjs-rbac';
import { AppRbacGuard } from '@/infrastructure/auth/app-rbac.guard';
import { FileOwnerFilter } from './filters/file-owner.filter';
import { RBAC_ROLES } from './rbac.permissions';
import { buildRbacStorageContent } from './rbac.storage';

const { permissions, grants } = buildRbacStorageContent();

const RBAC_STORAGE: IStorageRbac = {
  roles: [RBAC_ROLES.admin, RBAC_ROLES.user],
  permissions,
  grants,
  filters: {
    [ASYNC_RBAC_REQUEST_FILTER]: FileOwnerFilter,
  },
};

@Global()
@Module({
  imports: [RBAcModule.forRoot(RBAC_STORAGE, [FileOwnerFilter])],
  providers: [AppRbacGuard],
  exports: [AppRbacGuard],
})
export class AppRbacModule {}

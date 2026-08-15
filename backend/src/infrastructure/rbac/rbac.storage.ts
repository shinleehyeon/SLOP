import type { IStorageRbac } from 'nestjs-rbac';
import { RBAC_ENTITIES } from './rbac.definitions';
import { RBAC_GRANTS } from './rbac.grants';

export function buildRbacStorageContent(): Pick<IStorageRbac, 'permissions' | 'grants'> {
  return {
    permissions: Object.fromEntries(
      Object.entries(RBAC_ENTITIES).map(([entity, actions]) => [entity, [...actions]]),
    ) as IStorageRbac['permissions'],
    grants: Object.fromEntries(
      Object.entries(RBAC_GRANTS).map(([role, grants]) => [role, [...grants]]),
    ) as IStorageRbac['grants'],
  };
}

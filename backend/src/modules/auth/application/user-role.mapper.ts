import { UserRole } from '@/generated/prisma/client';
import { RBAC_ROLES } from '@/infrastructure/rbac/rbac.permissions';

export function toRbacRole(role: UserRole | string) {
  return String(role).toUpperCase() === UserRole.ADMIN ? RBAC_ROLES.admin : RBAC_ROLES.user;
}

import { applyDecorators, UseGuards } from '@nestjs/common';
import { RBAcAsyncPermissions } from 'nestjs-rbac';
import { AppRbacGuard } from '@/infrastructure/auth/app-rbac.guard';

/** Uses async RBAC path so `filters` (e.g. file owner) work on every route. */
export function RequirePermissions(...permissions: string[]) {
  return applyDecorators(RBAcAsyncPermissions(...permissions), UseGuards(AppRbacGuard));
}

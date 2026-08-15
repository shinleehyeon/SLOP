import { ASYNC_RBAC_REQUEST_FILTER } from 'nestjs-rbac';

export const RBAC_ROLES = {
  admin: 'admin',
  user: 'user',
} as const;

export type RbacRole = (typeof RBAC_ROLES)[keyof typeof RBAC_ROLES];

/** Single source of truth: entity -> actions registered in nestjs-rbac. */
export const RBAC_ENTITIES = {
  audit_log: ['list'],
  auth: ['change_password', 'logout_all', 'read_session'],
  system: ['read_metrics'],
  file: [
    'create_upload',
    ASYNC_RBAC_REQUEST_FILTER,
    'create_upload_any',
    'complete_any',
    'list',
    'delete_any',
  ],
  user: [
    'create',
    'delete',
    'delete_self',
    'force_logout',
    'list',
    'read',
    'read_oauth',
    'read_self',
    'reset_password',
    'unlink_oauth',
    'unlink_oauth_self',
    'update',
    'update_self',
  ],
  onboarding: ['save', 'read'],
  field: ['generate_terms', 'save_choice'],
  short: [
    'create_series',
    'request_generate',
    'list_generations',
    'list_series',
    'read_series',
    'suggest',
    'check_duplicate',
    'like',
    'create_comment',
    'list_comments',
    'delete_comment',
  ],
  text_summary: ['create'],
  learning: ['read'],
  search: ['read'],
} as const;

export type RbacEntity = keyof typeof RBAC_ENTITIES;

export type RbacAction<E extends RbacEntity = RbacEntity> = (typeof RBAC_ENTITIES)[E][number];

/** All `entity@action` permission strings derived from RBAC_ENTITIES. */
export type RbacPermission = {
  [E in RbacEntity]: `${E & string}@${Extract<RbacAction<E>, string>}`;
}[RbacEntity];

export type RbacEntityGrant = RbacEntity | `&${RbacEntity}`;

export type RbacGrant = RbacPermission | RbacEntityGrant;

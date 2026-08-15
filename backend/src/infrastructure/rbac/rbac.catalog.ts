import { ASYNC_RBAC_REQUEST_FILTER } from 'nestjs-rbac';
import { perm } from './rbac.helpers';

/** Typed permission catalog grouped by domain entity. */
export const RBAC = {
  auditLog: {
    list: perm('audit_log', 'list'),
  },
  auth: {
    changePassword: perm('auth', 'change_password'),
    logoutAll: perm('auth', 'logout_all'),
    readSession: perm('auth', 'read_session'),
  },
  system: {
    readMetrics: perm('system', 'read_metrics'),
  },
  file: {
    createUpload: perm('file', 'create_upload'),
    completeOwn: perm('file', ASYNC_RBAC_REQUEST_FILTER),
    adminCreateUpload: perm('file', 'create_upload_any'),
    adminComplete: perm('file', 'complete_any'),
    adminList: perm('file', 'list'),
    adminDelete: perm('file', 'delete_any'),
  },
  user: {
    create: perm('user', 'create'),
    delete: perm('user', 'delete'),
    deleteSelf: perm('user', 'delete_self'),
    forceLogout: perm('user', 'force_logout'),
    list: perm('user', 'list'),
    read: perm('user', 'read'),
    readOAuth: perm('user', 'read_oauth'),
    readSelf: perm('user', 'read_self'),
    resetPassword: perm('user', 'reset_password'),
    unlinkOAuth: perm('user', 'unlink_oauth'),
    unlinkOAuthSelf: perm('user', 'unlink_oauth_self'),
    update: perm('user', 'update'),
    updateSelf: perm('user', 'update_self'),
  },
  onboarding: {
    save: perm('onboarding', 'save'),
    read: perm('onboarding', 'read'),
  },
  field: {
    generateTerms: perm('field', 'generate_terms'),
    saveChoice: perm('field', 'save_choice'),
  },
  short: {
    createSeries: perm('short', 'create_series'),
    requestGenerate: perm('short', 'request_generate'),
    listGenerations: perm('short', 'list_generations'),
    listSeries: perm('short', 'list_series'),
    readSeries: perm('short', 'read_series'),
    suggest: perm('short', 'suggest'),
    checkDuplicate: perm('short', 'check_duplicate'),
    like: perm('short', 'like'),
    createComment: perm('short', 'create_comment'),
    listComments: perm('short', 'list_comments'),
    deleteComment: perm('short', 'delete_comment'),
  },
  textSummary: {
    create: perm('text_summary', 'create'),
  },
  learning: {
    read: perm('learning', 'read'),
  },
  search: {
    read: perm('search', 'read'),
  },
} as const;

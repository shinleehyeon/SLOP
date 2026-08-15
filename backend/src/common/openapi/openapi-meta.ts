export const OPENAPI_GROUPS = {
  admin: 'Admin',
  application: 'Application',
  authentication: 'Authentication',
  system: 'System',
} as const;

export const OPENAPI_TAGS = {
  adminAuditLogs: 'Admin Audit Logs',
  adminFiles: 'Admin Files',
  adminSystem: 'Admin System',
  adminUsers: 'Admin Users',
  auth: 'Auth',
  debug: 'Debug',
  files: 'Files',
  health: 'Health',
  oauth: 'OAuth',
  users: 'Users',
  onboarding: 'Onboarding',
  fields: 'Fields',
  shorts: 'Shorts',
  textSummaries: 'Text Summaries',
  learning: 'Learning',
  search: 'Search',
} as const;

export const AUTH_API_CONTROLLER = {
  tag: OPENAPI_TAGS.auth,
  group: OPENAPI_GROUPS.authentication,
  description: '회원가입, 로그인, 토큰, 세션',
} as const;

export const SYSTEM_HEALTH_API_CONTROLLER = {
  tag: OPENAPI_TAGS.health,
  group: OPENAPI_GROUPS.system,
} as const;

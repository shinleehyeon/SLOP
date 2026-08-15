export const OPENAPI_METHODS = [
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'options',
  'head',
] as const;

export type OpenApiMethod = (typeof OPENAPI_METHODS)[number];

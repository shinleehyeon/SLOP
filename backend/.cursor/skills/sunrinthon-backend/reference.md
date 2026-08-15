# Sunrinthon Backend — Reference

## Module inventory

| Module | Path | Notes |
|---|---|---|
| auth | `src/modules/auth/` | JWT, local, OAuth, refresh store |
| users | `src/modules/users/` | me CRUD |
| admin | `src/modules/admin/` | admin users list, files, audit logs |
| files | `src/modules/files/` | S3 presigned upload, cleanup job |
| audit-log | `src/modules/audit-log/` | Global module, async DB write |
| health | `src/modules/health/` | Terminus health checks |

## Infrastructure

| Concern | Path |
|---|---|
| Prisma | `src/infrastructure/database/` |
| RBAC | `src/infrastructure/rbac/` |
| Logging (Pino) | `src/infrastructure/logging/` |
| Request context (CLS) | `src/infrastructure/request-context/` |
| Redis | `src/infrastructure/redis/` |
| Throttle | `src/infrastructure/throttle/` |

## Global app wiring (`src/app.module.ts`)

- `JwtAuthGuard` + `ThrottlerGuard` as APP_GUARD
- `ZodValidationPipe`, `ZodSerializerInterceptor`
- `ResponseEnvelopeInterceptor`, `RequestIdHeaderInterceptor`
- API prefix `/api` set in `main.ts`

## RBAC storage (current)

Single source: `src/infrastructure/rbac/rbac.definitions.ts` (`RBAC_ENTITIES`).

```typescript
// rbac.definitions.ts
export const RBAC_ENTITIES = {
  auth: ['change_password', 'logout_all', 'read_session'],
  file: ['create_upload', 'ASYNC_RBAC_REQUEST_FILTER', /* ... */],
  user: ['delete_self', 'list', 'read_self', 'update_self'],
} as const;

// rbac.catalog.ts — typed usage in controllers
RBAC.user.list   // 'user@list'
RBAC.file.createUpload

// rbac.grants.ts — role grants
grants: {
  admin: [inheritEntity('user'), RBAC.user.list, /* ... */],
  user: [grantEntity('auth'), grantEntity('file'), RBAC.user.readSelf, /* ... */],
}
```

Permission string format: `entity@action`. Types: `RbacPermission = \`${Entity}@${Action}\``.

Admin inherits all user permissions via `inheritEntity('user')` → `'&user'`.

## Audit log actions (current)

```
auth.login, auth.logout, auth.logout_all, auth.password_changed,
auth.refresh, auth.register, oauth.login,
file.attached, file.deleted, file.upload_completed, file.upload_url_created,
user.deleted, user.updated
```

`AuditLogService.record()` enriches from CLS: `requestId`, `ip`, `userAgent`, `userId`. Does not store request/response bodies.

## Pagination helpers

File: `src/common/dto/pagination.dto.ts`

- Query: `page` (default 1), `limit` (default 20, max 100)
- `getPaginationOffset({ page, limit })`
- `createPaginationMeta({ page, limit, total })`
- `createPaginatedResponseSchema(itemSchema)` for list response DTOs
- OpenAPI: `@ApiPaginationQuery()` decorator

## Prisma

| Item | Location |
|---|---|
| Config | `prisma.config.ts` |
| Generator | `prisma/schema.prisma` |
| Models | `prisma/schemas/*.prisma` |
| Migrations | `prisma/migrations/` |
| Seed | `prisma/seed.ts` |
| Client output | `src/generated/prisma/` |

Prisma 7 requires driver adapter:

```typescript
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });
```

After schema change: `bun run prisma:migrate` then `bun run prisma:seed` if needed.

**Do not hand-write migration SQL.** Only change schema files; let Prisma CLI generate `prisma/migrations/`.

## Environment variables

See `.env.example` and `src/config/env.schema.ts`.

Required groups: database, JWT secrets (min 32 chars), Redis, S3/R2. OAuth creds required when provider enabled.

## OpenAPI / docs

- Scalar UI when `DOCS_ENABLED=true`
- `@ApiEndpoint` combines tags, operation, ZodResponse, optional `@Public()`
- Error statuses via `errorStatuses` + `x-error-statuses` extension

## Testing

- Unit: Jest configured, no specs yet (`*.spec.ts` under `src/`)
- E2E: `test/app.e2e-spec.ts` — full AppModule, envelope assertions
- Run: `bun run test:e2e` (requires running Postgres + Redis)

## Hackathon demo checklist

```
- [ ] bun run prisma:migrate && bun run prisma:seed
- [ ] bun run dev
- [ ] Login as admin@sunrinthon.dev / Password123!
- [ ] Open docs (DOCS_ENABLED=true)
- [ ] Verify GET /api/admin/users (admin list)
- [ ] Verify auth flow: register → login → /users/me
```

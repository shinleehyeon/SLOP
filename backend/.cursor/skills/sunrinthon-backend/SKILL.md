---
name: sunrinthon-backend
description: >-
  Sunrinthon 12th hackathon NestJS backend (Bun, Prisma 7, Zod DTOs, RBAC, JWT/OAuth,
  S3/R2 files, audit log, Pino). Use when adding APIs, modules, migrations, seed data,
  permissions, auth, file upload, pagination, or running dev/deploy commands in this repo.
---

# Sunrinthon Backend

## Quick commands

```bash
bun run dev              # local server (prefix /api)
bun run build            # production build
bun run check            # biome lint + format
bun run prisma:generate  # generate client → src/generated/prisma
bun run prisma:migrate   # dev migration
bun run prisma:seed      # seed users (explicit in Prisma 7)
bun run prisma:deploy    # prod migrations
bun run test:e2e         # needs DB + Redis + .env
```

Copy `.env.example` → `.env`. App uses `DATABASE_URL`; migrations/seed use `DATABASE_DIRECT_URL` when set.

## Seed accounts (dev)

| Email | Role | Password |
|---|---|---|
| admin@sunrinthon.dev | ADMIN | Password123! |
| user@sunrinthon.dev | USER | Password123! |
| demo@sunrinthon.dev | USER | Password123! |

## Architecture

```
src/modules/<feature>/
  <feature>.module.ts
  application/<feature>.service.ts
  infrastructure/<feature>.repository.ts
  presentation/<feature>.controller.ts
  presentation/dto/*.dto.ts
```

- **Controller**: HTTP only — decorators + delegate to service
- **Service**: business logic, audit log, cross-module calls
- **Repository**: Prisma only, no HTTP
- **Import alias**: `@/*` → `src/*`
- **Prisma client**: `@/generated/prisma/client`

Register new modules in `src/app.module.ts`.

## New feature checklist

```
- [ ] prisma/schemas/*.prisma 수정 → **사용자**가 `bun run prisma:migrate` (Agent는 Prisma CLI·migration 파일 금지)
- [ ] module folders (application / infrastructure / presentation/dto)
- [ ] Zod request + response DTOs (createZodDto)
- [ ] controller with @ApiEndpoint + @RequirePermissions
- [ ] RBAC in rbac.definitions.ts + rbac.catalog.ts + rbac.grants.ts
- [ ] audit action in audit-log.actions.ts + record() in service
- [ ] register module in app.module.ts
- [ ] bun run check && bun run build
```

Detailed patterns: [reference.md](reference.md)

## Related skills

| Skill | Use when |
|---|---|
| `@new-api-module` | New domain module from scratch |
| `@add-endpoint` | Add route to existing module |
| `@debug-backend` | 401/403/500, Prisma, Redis errors |
| `@hackathon-demo` | Local setup, demo checklist |

Agent index: [.cursor/AGENTS.md](../../AGENTS.md)

## DTO pattern

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateFooSchema = z.object({ name: z.string().trim().min(1).max(100) });
export class CreateFooRequestDto extends createZodDto(CreateFooSchema) {}

export const FooResponseSchema = z.object({ id: z.string(), name: z.string() });
export class FooResponseDto extends createZodDto(FooResponseSchema) {}
```

## Controller pattern

```typescript
@Controller('foos')
@ApiController({
  tag: OPENAPI_TAGS.foos,
  group: OPENAPI_GROUPS.application,
  description: 'Foo 관리 API',
})
export class FoosController {
  constructor(private readonly foosService: FoosService) {}

  @Get()
  @RequirePermissions(RBAC.foo.list)
  @ApiPaginationQuery()
  @ApiEndpoint({
    title: '목록 조회',
    status: 200,
    response: FooListResponseDto,
  })
  list(@Query() query: PaginationQueryDto) {
    return this.foosService.list(query);
  }
}
```

- `@ApiController({ tag, group, description? })` on class; `@ApiEndpoint` inherits tag/group
- Protected routes default to `401`, `403`, `500` error docs — add only extra codes in `errorStatuses`
- Current user: `@CurrentUserId()` or `@CurrentUser()`
- Paginated list: `PaginationQueryDto`, `getPaginationOffset`, `createPaginationMeta`, `createPaginatedResponseSchema`

## RBAC (4 steps)

1. Add entity/actions in `src/infrastructure/rbac/rbac.definitions.ts` → `RBAC_ENTITIES`
2. Add catalog entry in `src/infrastructure/rbac/rbac.catalog.ts` (`perm()` 사용)
3. Add grants in `src/infrastructure/rbac/rbac.grants.ts`
4. Apply `@RequirePermissions(RBAC.x.y)` on handler

Role comes from DB (`users.role`) via `JwtStrategy` — admin changes apply without re-login

Resource ownership at guard: register filter in `app-rbac.module.ts` (e.g. `complete_own` → `FileOwnerFilter`). All routes use `@RequirePermissions` (async path internally).

## Audit log

```typescript
await this.auditLogService.record({
  action: AUDIT_LOG_ACTIONS.fooCreated,
  actorId: userId,
  targetType: 'foo',
  targetId: foo.id,
  metadata: { /* no secrets */ },
});
```

Add new actions to `src/modules/audit-log/application/audit-log.actions.ts`.

## Auth

- Global `JwtAuthGuard` — skip with `@Public()` or `@ApiEndpoint({ isPublic: true })`
- Access token: `Authorization: Bearer <token>`
- Refresh tokens in Redis (`RefreshTokenStore`)

## File upload flow

1. `POST /files/presigned-upload` (auth) or anonymous variant for register
2. Client PUT to S3/R2
3. `POST /files/:fileId/complete`
4. Attach `fileId` in domain API (e.g. profile image on register/update)

Statuses: PENDING → TEMPORARY → ATTACHED

## Response envelope

All success responses are wrapped:

```json
{ "status": 200, "method": "GET", "instance": "/api/users/me", "body": {}, "timestamp": "..." }
```

E2E asserts use `response.body.body`.

## Conventions

- **Migration**: edit `prisma/schemas/*.prisma` only — **Agent는 Prisma CLI·migration 파일 생성/수정 금지**; 사용자가 `bun run prisma:migrate` 실행
- Package manager: **bun** (not npm/yarn)
- Linter: **Biome** (`bun run check`)
- IDs: **cuid** (Prisma default), not UUID
- Password hash: bcrypt **12 rounds** (same as AuthService)
- Do not commit `.env` or secrets
- Do not create git commits unless the user explicitly asks
- Keep diffs minimal — match existing module style

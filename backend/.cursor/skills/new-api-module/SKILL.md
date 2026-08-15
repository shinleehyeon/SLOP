---
name: new-api-module
description: >-
  Scaffold and wire a new NestJS feature module in sunrinthon backend. Use when
  creating a new domain, resource, or CRUD module from scratch, adding Prisma
  models, or when the user says "새 모듈", "도메인 추가", "CRUD 만들어줘".
---

# New API Module

End-to-end workflow for adding a new domain module. **Always follow steps in order.**

## 1. Plan

Confirm with user (or infer):
- Module/route name (plural kebab: `teams`, `projects`)
- Needs DB? (usually yes)
- Public or auth + RBAC?
- Fields for Prisma model

## 2. Prisma model (if DB-backed)

Edit `prisma/schemas/<name>.prisma` only — **never hand-write migration SQL**.

```prisma
model Team {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("teams")
}
```

Then (**사용자** 터미널에서):

```bash
bun run prisma:migrate
bun run prisma:generate
```

## 3. Create module folders

Copy structure from an existing module (e.g. `src/modules/users/`):

```
src/modules/<name>/
  <name>.module.ts
  application/<name>.service.ts
  infrastructure/<name>.repository.ts   # if DB
  presentation/<name>.controller.ts
  presentation/dto/*.dto.ts
```

## 4. Register module

Add to `src/app.module.ts` imports:

```typescript
import { TeamsModule } from './modules/teams/teams.module';
// ...
TeamsModule,
```

## 5. RBAC (protected endpoints)

1. `src/infrastructure/rbac/rbac.definitions.ts` — `RBAC_ENTITIES`에 entity/action 추가
2. `src/infrastructure/rbac/rbac.catalog.ts` — `RBAC.<entity>.<action>` (`perm()` 사용)
3. `src/infrastructure/rbac/rbac.grants.ts` — role grants 추가

## 6. Customize

- Repository: match actual Prisma model fields
- Service: business logic, call `auditLogService.record()` on mutations
- DTOs: Zod schemas matching API contract
- Add create/update/delete handlers as needed (see `@add-endpoint`)

## 7. Verify

```bash
bun run check
bun run build
```

## Agent checklist

```
- [ ] prisma/schemas updated → **사용자** `prisma:migrate` (Agent CLI·migration 금지)
- [ ] module folders + controller/service/repository/DTOs
- [ ] app.module.ts registered
- [ ] RBAC definitions + catalog + grants
- [ ] audit actions for mutations (if any)
- [ ] check + build pass
```

## Reference

Project conventions: `@sunrinthon-backend` or `.cursor/skills/sunrinthon-backend/reference.md`

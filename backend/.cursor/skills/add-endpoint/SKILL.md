---
name: add-endpoint
description: >-
  Add a new HTTP endpoint to an existing NestJS module in sunrinthon backend.
  Use when adding routes, handlers, DTOs, or permissions to existing controllers,
  or when the user says "API 추가", "엔드포인트 추가", "POST /...", "GET /...".
---

# Add Endpoint

Add an endpoint to an **existing** module. Do not scaffold a new module — use `@new-api-module` for that.

## Workflow

### 1. Locate module

```
src/modules/<name>/
  presentation/<name>.controller.ts
  application/<name>.service.ts
  infrastructure/<name>.repository.ts  (if DB)
  presentation/dto/
```

### 2. DTOs

Add request/response Zod DTOs in `presentation/dto/`:

```typescript
export const CreateFooSchema = z.object({ name: z.string().trim().min(1) });
export class CreateFooRequestDto extends createZodDto(CreateFooSchema) {}
```

Paginated list response: `createPaginatedResponseSchema()` from `@/common/dto/pagination.dto`.

### 3. Repository method (if DB)

Add query in `infrastructure/*.repository.ts` — Prisma only, no HTTP.

### 4. Service method

Business logic in `application/*.service.ts`:
- Throw Nest HTTP exceptions (`NotFoundException`, `ForbiddenException`, …)
- Mutations: `auditLogService.record()` with action from `audit-log.actions.ts`

### 5. Controller handler

```typescript
@Controller('foos')
@ApiController({
  tag: OPENAPI_TAGS.foos,
  group: OPENAPI_GROUPS.application,
  description: 'Foo 관리 API',
})
export class FoosController {
  @Post()
  @RequirePermissions(RBAC.foo.create)
  @ApiEndpoint({
    title: 'Foo 생성',
    status: 201,
    response: FooResponseDto,
    errorStatuses: [400],
  })
  create(@CurrentUserId() userId: string, @Body() dto: CreateFooRequestDto) {
    return this.foosService.create(userId, dto);
  }
}
```

- `@ApiController({ tag, group, description? })` — 클래스 기본 tag/group
- `@ApiEndpoint({ title, status, response, tag?, group?, isPublic?, errorStatuses? })` — method override
- Protected routes: `401`, `403`, `500` are added by default (omit from `errorStatuses` unless extra codes needed)
- Public: `isPublic: true` on `@ApiEndpoint`
- List: `@ApiPaginationQuery()` + `PaginationQueryDto`
- Admin-only: grant permission to `admin` role only in RBAC

### 6. RBAC (if new permission)

1. `rbac.definitions.ts` — entity/actions
2. `rbac.catalog.ts` — `RBAC.x.y`
3. `rbac.grants.ts` — role grants
3. `@RequirePermissions(...)` on handler

Skip RBAC only for `@ApiEndpoint({ isPublic: true })`.

### 7. Audit (mutations)

Add to `audit-log.actions.ts`:

```typescript
fooCreated: 'foo.created',
```

Call in service after successful mutation.

### 8. Verify

```bash
bun run check && bun run build
```

Test with curl against `http://localhost:8000/api/...`.

## Common patterns

| Need | Decorators / imports |
|---|---|
| Auth user | `@CurrentUserId()`, `@CurrentUser()` |
| Pagination | `@ApiPaginationQuery()`, `PaginationQueryDto` |
| OpenAPI | `@ApiController` + `@ApiEndpoint({ title, status, response, errorStatuses? })` |
| File owner | `@RequirePermissions(RBAC.file.completeOwn)` + `FileOwnerFilter` (`params.fileId` or `body.fileIds`) |

## Do not

- Hand-write `prisma/migrations/**/migration.sql`
- Put business logic in controller or repository
- Skip `@ApiEndpoint` on new handlers
- Commit without user request

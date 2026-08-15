---
name: debug-backend
description: >-
  Troubleshoot sunrinthon NestJS backend errors: 401, 403, 404, 500, Prisma,
  Redis, JWT, RBAC, envelope responses, file upload, migration issues. Use when
  debugging, fixing errors, or when the user pastes stack traces or HTTP errors.
---

# Debug Backend

Systematic debugging for this backend. **Investigate with commands — don't guess.**

## Response envelope

Success body is nested:

```json
{ "status": 200, "body": { ...actual data... } }
```

Errors use RFC 7807 problem details (not envelope).

## Quick diagnostics

```bash
bun run dev                    # is server running?
curl -s http://localhost:8000/api/version
curl -s http://localhost:8000/api/health
```

## Error matrix

| Symptom | Likely cause | Fix |
|---|---|---|
| 401 Unauthorized | Missing/expired JWT, invalid user | Login again; check `Authorization: Bearer`; access token TTL 15m |
| 403 Forbidden | RBAC permission missing | Check `users.role` in DB; `app-rbac.module.ts` grants; `@RequirePermissions` on handler |
| 404 Not Found | Wrong route prefix | Routes are under `/api/` — e.g. `/api/users/me` |
| 400 Validation | Zod DTO mismatch | Check request body against DTO schema |
| 500 Prisma | Model/client drift | `bun run prisma:generate`; run pending migrations |
| Refresh fails | Redis down | Start Redis; check `REDIS_URL` |
| File upload fails | S3/R2 env | Check `AWS_*` vars in `.env` |
| Migration error | Manual SQL / drift | Edit schema only → `bun run prisma:migrate`; never edit migration.sql |
| Empty data | No seed | `bun run prisma:seed` |
| Role change no effect | JWT vs DB | Role loaded from DB each request via JwtStrategy — no re-login needed |

## RBAC debug

1. User role in DB: `users.role` = `ADMIN` or `USER`
2. Permission on endpoint: `@RequirePermissions('user@list')` etc.
3. Grants in `app-rbac.module.ts` — does role have that permission?
4. Admin inherits user perms via `'&user'`

Test admin:

```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sunrinthon.dev","password":"Password123!"}'
```

## Prisma debug

```bash
bun run prisma:generate
bun run prisma:migrate
bun run prisma:studio    # inspect data
```

Connection: `DATABASE_URL` (app), `DATABASE_DIRECT_URL` (CLI).

## Logs

- Dev: Pino pretty — `GET /api/... -> 200 7ms`
- Request ID: response header `x-request-id`
- Audit: `audit_logs` table

## Agent debug workflow

```
1. Read exact error message / status / stack trace
2. Identify layer: auth → RBAC → validation → service → prisma → external (redis/s3)
3. Read relevant controller → service → repository
4. Reproduce with curl if possible
5. Fix minimal root cause
6. bun run check && bun run build
```

## Seed credentials

| Email | Role | Password |
|---|---|---|
| admin@sunrinthon.dev | ADMIN | Password123! |
| user@sunrinthon.dev | USER | Password123! |

## Reference

Full stack details: `@sunrinthon-backend` → `reference.md`

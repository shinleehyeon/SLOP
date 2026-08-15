---
name: hackathon-demo
description: >-
  Sunrinthon hackathon demo and local setup checklist. Use when preparing a demo,
  resetting the dev environment, testing auth/admin flows, or troubleshooting
  local startup before presentation.
---

# Hackathon Demo Prep

## Local startup

```bash
cp .env.example .env   # fill in DB, Redis, JWT, S3 keys
bun install
bun run prisma:migrate
bun run prisma:seed
bun run dev            # http://localhost:8000/api
```

## Demo accounts

| Email | Role | Password |
|---|---|---|
| admin@sunrinthon.dev | ADMIN | Password123! |
| user@sunrinthon.dev | USER | Password123! |
| demo@sunrinthon.dev | USER | Password123! |

## Quick API smoke test

```bash
# Login
curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sunrinthon.dev","password":"Password123!"}'

# Use accessToken from response.body.body.accessToken
curl -s http://localhost:8000/api/users/me \
  -H "Authorization: Bearer <accessToken>"

# Admin user list
curl -s "http://localhost:8000/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer <accessToken>"
```

## Docs

Set `DOCS_ENABLED=true` in `.env`. Open Scalar API reference (configured in bootstrap).

## Demo flow suggestions

1. Register new user (optional profile image upload flow)
2. Login → GET `/api/users/me`
3. Admin login → GET `/api/admin/users` (paginated list)
4. File upload: presigned-upload → PUT S3 → complete → attach
5. OAuth login (if Google/GitHub creds configured)

## Troubleshooting

| Problem | Fix |
|---|---|
| Prisma client not found | `bun run prisma:generate` |
| Migration drift | `bun run prisma:migrate` |
| Empty users table | `bun run prisma:seed` |
| 401 on protected routes | Check Bearer token, token expiry (15m default) |
| Refresh fails | Redis must be running (`REDIS_URL`) |
| File upload fails | Check S3/R2 env vars in `.env` |
| RBAC 403 | User role in DB (`users.role`), not JWT payload |

## Reset dev DB

```bash
bun run prisma:reset   # drops DB, re-migrates (seed separately in v7)
bun run prisma:seed
```

## Pre-demo checklist

```
- [ ] Postgres + Redis running
- [ ] .env filled (JWT secrets ≥ 32 chars)
- [ ] bun run prisma:seed
- [ ] bun run dev starts without errors
- [ ] curl login + `/users/me` works (see Quick API test above)
- [ ] DOCS_ENABLED=true for live API docs
```

## Agent prompts (copy-paste)

```
@hackathon-demo 로컬 환경 점검해줘
```

```
@new-api-module <domain> 추가해줘
```

```
@add-endpoint <module>에 <METHOD> <path> 추가해줘
```

```
@debug-backend <에러 설명>
```

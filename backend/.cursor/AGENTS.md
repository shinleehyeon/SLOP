# Cursor Agent Guide — Sunrinthon Backend

해커톤 백엔드 작업 시 Agent가 먼저 읽을 진입점입니다.

## Skills (채팅에서 @로 호출)

| Skill | 언제 쓰나 |
|---|---|
| `@sunrinthon-backend` | 일반 백엔드 작업, 컨벤션 확인 |
| `@new-api-module` | **새 도메인/모듈** 처음부터 만들 때 |
| `@add-endpoint` | **기존 모듈**에 API 추가할 때 |
| `@debug-backend` | 401/403/500, Prisma, Redis 등 디버깅 |
| `@hackathon-demo` | 로컬 셋업, 데모 체크리스트 |

## Rules (자동 적용)

- `project-core.mdc` — bun, biome, **Prisma CLI·migration Agent 금지**, git commit 규칙
- `nestjs-module.mdc` — `src/**/*.ts` 작업 시
- `prisma.mdc` — `prisma/**/*` 작업 시 (**Agent: schema만 수정, CLI·migration 파일 금지**)
- `agent-workflow.mdc` — Agent 작업 순서/검증

## Scripts (Agent가 실행)

```bash
bun run check && bun run build   # 작업 완료 전 필수
```

## Hooks (자동)

- **afterFileEdit** — Biome auto-fix on edited files
- **stop** — TS 변경 시 check/build 리마인더

## 빠른 프롬프트 예시

```
@new-api-module teams 도메인 추가해줘. Team 모델(name 필수) 포함.
```

```
@add-endpoint users 모듈에 PATCH /users/:id (admin 전용) 추가해줘
```

```
@debug-backend GET /users/me 401 나와
```

```
@hackathon-demo 로컬 환경 점검해줘
```

FROM oven/bun:1.3.11-slim AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM install AS build
COPY . .
RUN bun run prisma:generate
RUN bunx nest build && bunx tsc-alias -p tsconfig.build.json

FROM build AS production-deps
ENV HUSKY=0
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM base AS runner
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

USER bun
EXPOSE 8000

ENTRYPOINT ["bun", "dist/main.js"]

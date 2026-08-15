import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const databaseDirectUrl = process.env.DATABASE_DIRECT_URL;

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun prisma/seed.ts',
  },
  ...(databaseDirectUrl
    ? {
        datasource: {
          url: env('DATABASE_DIRECT_URL'),
        },
      }
    : {}),
});

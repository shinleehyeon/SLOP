require('dotenv/config');

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { SearchIndexerService } = require('../dist/infrastructure/meilisearch/search-indexer.service');

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const indexer = app.get(SearchIndexerService);
    await indexer.reindexAll();
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
  process.exit(1);
});

import { Global, Module } from '@nestjs/common';
import { FilesModule } from '@/modules/files/files.module';
import { MeiliSearchService } from './meilisearch.service';
import { SearchIndexerService } from './search-indexer.service';

@Global()
@Module({
  imports: [FilesModule],
  providers: [MeiliSearchService, SearchIndexerService],
  exports: [MeiliSearchService, SearchIndexerService],
})
export class MeiliSearchModule {}

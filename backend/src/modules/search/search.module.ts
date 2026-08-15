import { Module } from '@nestjs/common';
import { FilesModule } from '@/modules/files/files.module';
import { SearchService } from './application/search.service';
import { SearchRepository } from './infrastructure/search.repository';
import { SearchController } from './presentation/search.controller';

@Module({
  imports: [FilesModule],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository],
})
export class SearchModule {}

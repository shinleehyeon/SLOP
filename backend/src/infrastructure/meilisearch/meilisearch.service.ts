import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Index, Meilisearch } from 'meilisearch';
import type { MeiliAccountDocument, MeiliShortDocument } from './meilisearch.types';

@Injectable()
export class MeiliSearchService implements OnModuleInit {
  private readonly logger = new Logger(MeiliSearchService.name);
  private readonly client: Meilisearch;
  private readonly prefix: string;
  private ready = false;

  constructor(private readonly configService: ConfigService) {
    this.client = new Meilisearch({
      host: this.configService.getOrThrow<string>('meilisearch.host'),
      apiKey: this.configService.getOrThrow<string>('meilisearch.apiKey'),
    });
    this.prefix = this.configService.get<string>('meilisearch.indexPrefix') ?? '';
  }

  async onModuleInit() {
    try {
      await this.ensureIndexes();
      this.ready = true;
    } catch (error) {
      this.logger.error(
        `MeiliSearch index setup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  isReady() {
    return this.ready;
  }

  accountsIndexName() {
    return `${this.prefix}accounts`;
  }

  shortsIndexName() {
    return `${this.prefix}shorts`;
  }

  accountsIndex(): Index<MeiliAccountDocument> {
    return this.client.index<MeiliAccountDocument>(this.accountsIndexName());
  }

  shortsIndex(): Index<MeiliShortDocument> {
    return this.client.index<MeiliShortDocument>(this.shortsIndexName());
  }

  async ensureIndexes() {
    await this.client
      .createIndex(this.accountsIndexName(), { primaryKey: 'id' })
      .catch(() => undefined);
    await this.client
      .createIndex(this.shortsIndexName(), { primaryKey: 'id' })
      .catch(() => undefined);

    await this.accountsIndex().updateSettings({
      searchableAttributes: ['name', 'fieldNames', 'description', 'email'],
      displayedAttributes: [
        'id',
        'name',
        'fieldNames',
        'description',
        'shortSeriesCount',
        'profileImageUrl',
        'createdAt',
      ],
      sortableAttributes: ['createdAt', 'shortSeriesCount'],
    });

    await this.shortsIndex().updateSettings({
      searchableAttributes: ['title', 'seriesTitle', 'tags', 'creatorName'],
      displayedAttributes: [
        'id',
        'seriesId',
        'title',
        'seriesTitle',
        'tags',
        'videoUrl',
        'creatorUserId',
        'creatorName',
        'createdAt',
      ],
      sortableAttributes: ['createdAt'],
    });

    this.ready = true;
  }

  async upsertAccounts(documents: MeiliAccountDocument[]) {
    if (documents.length === 0) {
      return;
    }
    await this.accountsIndex().addDocuments(documents, { primaryKey: 'id' });
  }

  async upsertShorts(documents: MeiliShortDocument[]) {
    if (documents.length === 0) {
      return;
    }
    await this.shortsIndex().addDocuments(documents, { primaryKey: 'id' });
  }

  async deleteAccount(userId: string) {
    await this.accountsIndex().deleteDocument(userId);
  }

  async deleteShorts(shortIds: string[]) {
    if (shortIds.length === 0) {
      return;
    }
    await this.shortsIndex().deleteDocuments(shortIds);
  }

  async searchAccounts(query: string, limit: number) {
    return this.accountsIndex().search(query, { limit });
  }

  async searchShorts(query: string, limit: number) {
    return this.shortsIndex().search(query, {
      limit,
      sort: ['createdAt:desc'],
    });
  }
}

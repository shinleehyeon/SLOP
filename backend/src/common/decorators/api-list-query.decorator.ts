import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ApiPaginationQuery } from './api-pagination-query.decorator';

interface ApiListQueryOptions {
  filtersExample?: string;
  filterOptionsExample?: string;
  sortExample?: string;
  queryExample?: string;
}

export function ApiListQuery(options: ApiListQueryOptions = {}) {
  return applyDecorators(
    ApiPaginationQuery(),
    ApiQuery({
      name: 'query',
      required: false,
      description: 'sortable/text 컬럼 전체 OR 검색 (filters와 동시 사용 불가)',
      example: options.queryExample ?? 'kim',
    }),
    ApiQuery({
      name: 'filters',
      required: false,
      description: '필드별 필터 JSON (query와 동시 사용 불가)',
      example: options.filtersExample ?? '{"role":"admin"}',
    }),
    ApiQuery({
      name: 'filterOptions',
      required: false,
      description: 'filters 결합 방식',
      example: options.filterOptionsExample ?? '{"match":"and"}',
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      description: '정렬 (`-field` desc, `field` asc)',
      example: options.sortExample ?? '-createdAt',
    }),
  );
}

import { getPaginationOffset } from '@/common/dto/pagination.dto';
import type {
  FilterMatch,
  ListQueryConfig,
  ParsedSort,
  ResolvedListQuery,
} from './list-query.types';

export function hasFilterEntries(filters: unknown): filters is Record<string, unknown> {
  return Boolean(filters) && typeof filters === 'object' && Object.keys(filters).length > 0;
}

export function parseSortParam(sort: string | undefined, config: ListQueryConfig): ParsedSort {
  if (!sort) {
    return config.defaultSort;
  }

  const order = sort.startsWith('-') ? 'desc' : 'asc';
  const field = sort.startsWith('-') ? sort.slice(1) : sort;

  return { field, order };
}

interface ListQueryInput<TFilters extends Record<string, unknown>> {
  page: number;
  limit: number;
  query?: string;
  filters?: TFilters;
  filterOptions?: { match: FilterMatch };
  sort?: string;
}

export function resolveListQuery<TFilters extends Record<string, unknown>>(
  query: ListQueryInput<TFilters>,
  config: ListQueryConfig,
): ResolvedListQuery<TFilters> {
  const filters = hasFilterEntries(query.filters) ? query.filters : undefined;

  return {
    page: query.page,
    limit: query.limit,
    offset: getPaginationOffset(query),
    query: query.query,
    filters,
    filterMatch: query.filterOptions?.match ?? 'and',
    sort: parseSortParam(query.sort, config),
  };
}

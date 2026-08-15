export type SortOrder = 'asc' | 'desc';

export type FilterMatch = 'and' | 'or';

export interface ParsedSort {
  field: string;
  order: SortOrder;
}

export interface ListQueryConfig {
  sortableFields: readonly string[];
  defaultSort: ParsedSort;
}

export interface ResolvedListQuery<
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> {
  page: number;
  limit: number;
  offset: number;
  query?: string;
  filters?: TFilters;
  filterMatch: FilterMatch;
  sort: ParsedSort;
}

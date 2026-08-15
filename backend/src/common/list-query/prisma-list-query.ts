import { searchTextForms } from '@/common/text/normalize-text';
import type { FilterMatch, ParsedSort } from './list-query.types';

type WhereCondition = Record<string, unknown>;

function containsCondition(path: string[], form: string): WhereCondition {
  let condition: WhereCondition = { contains: form, mode: 'insensitive' as const };

  for (let index = path.length - 1; index >= 0; index -= 1) {
    condition = { [path[index]]: condition };
  }

  return condition;
}

export function containsWhere(path: string | string[], value: string): WhereCondition {
  const segments = Array.isArray(path) ? path : [path];
  const forms = searchTextForms(value);

  if (forms.length === 0) {
    return {};
  }

  const conditions = forms.map((form) => containsCondition(segments, form));

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { OR: conditions };
}

export function containsWhereAny(paths: Array<string | string[]>, value: string): WhereCondition[] {
  return paths.flatMap((path) => {
    const condition = containsWhere(path, value);

    return Object.keys(condition).length === 0 ? [] : [condition];
  });
}

export function buildTextQueryWhere(
  query: string | undefined,
  conditions: (query: string) => WhereCondition[],
): WhereCondition | undefined {
  if (!query) {
    return undefined;
  }

  const parts = conditions(query);

  if (parts.length === 0) {
    return undefined;
  }

  return parts.length === 1 ? parts[0] : { OR: parts };
}

export function defaultFilterCondition(field: string, value: unknown): WhereCondition {
  if (Array.isArray(value)) {
    return { [field]: { in: value } };
  }

  return { [field]: value };
}

export function stringContainsFilter(field: string) {
  return (value: unknown): WhereCondition => {
    if (typeof value === 'string') {
      return containsWhere(field, value);
    }

    if (Array.isArray(value)) {
      const conditions = value
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => containsWhere(field, item))
        .filter((condition) => Object.keys(condition).length > 0);

      if (conditions.length === 0) {
        return {};
      }

      if (conditions.length === 1) {
        return conditions[0];
      }

      return { OR: conditions };
    }

    return {};
  };
}

export function buildFiltersWhere(
  filters: Record<string, unknown> | undefined,
  match: FilterMatch,
  resolvers: Record<string, (value: unknown) => WhereCondition> = {},
): WhereCondition | undefined {
  if (!filters || Object.keys(filters).length === 0) {
    return undefined;
  }

  const conditions = Object.entries(filters)
    .map(([field, value]) => {
      const resolve = resolvers[field];

      return resolve ? resolve(value) : defaultFilterCondition(field, value);
    })
    .filter((condition) => Object.keys(condition).length > 0);

  if (conditions.length === 1) {
    return conditions[0];
  }

  return match === 'or' ? { OR: conditions } : { AND: conditions };
}

export function combineWhere(...parts: Array<WhereCondition | undefined>): WhereCondition {
  const conditions = parts.filter(Boolean) as WhereCondition[];

  if (conditions.length === 0) {
    return {};
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { AND: conditions };
}

export function buildOrderBy(sort: ParsedSort): Record<string, 'asc' | 'desc'> {
  return { [sort.field]: sort.order };
}

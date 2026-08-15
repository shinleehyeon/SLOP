import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { createListQuerySchema } from './create-list-query-schema';
import { parseSortParam, resolveListQuery } from './list-query.util';
import {
  buildFiltersWhere,
  buildTextQueryWhere,
  combineWhere,
  containsWhereAny,
  stringContainsFilter,
} from './prisma-list-query';

const TEST_CONFIG = {
  sortableFields: ['createdAt', 'name'] as const,
  defaultSort: { field: 'createdAt', order: 'desc' as const },
};

const TestQuerySchema = createListQuerySchema({
  ...TEST_CONFIG,
  filterSchema: z.object({ role: z.enum(['admin', 'user']).optional() }).strict(),
});

describe('parseSortParam', () => {
  it('parses descending sort', () => {
    expect(parseSortParam('-name', TEST_CONFIG)).toEqual({ field: 'name', order: 'desc' });
  });

  it('parses ascending sort', () => {
    expect(parseSortParam('name', TEST_CONFIG)).toEqual({ field: 'name', order: 'asc' });
  });

  it('uses default sort when omitted', () => {
    expect(parseSortParam(undefined, TEST_CONFIG)).toEqual(TEST_CONFIG.defaultSort);
  });
});

describe('createListQuerySchema', () => {
  it('rejects query and filters together', () => {
    const result = TestQuerySchema.safeParse({
      page: 1,
      limit: 20,
      query: 'kim',
      filters: { role: 'admin' },
    });

    expect(result.success).toBe(false);
  });

  it('accepts filters json string', () => {
    const result = TestQuerySchema.safeParse({
      page: 1,
      limit: 20,
      filters: '{"role":"admin"}',
      sort: '-name',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filters).toEqual({ role: 'admin' });
      expect(result.data.sort).toBe('-name');
    }
  });
});

describe('resolveListQuery', () => {
  it('resolves pagination and sort', () => {
    expect(
      resolveListQuery(
        {
          page: 2,
          limit: 10,
          sort: '-name',
        },
        TEST_CONFIG,
      ),
    ).toEqual({
      page: 2,
      limit: 10,
      offset: 10,
      query: undefined,
      filters: undefined,
      filterMatch: 'and',
      sort: { field: 'name', order: 'desc' },
    });
  });
});

describe('prisma list query helpers', () => {
  it('builds text query OR conditions', () => {
    expect(
      buildTextQueryWhere('kim', (query) => containsWhereAny([['name'], ['email']], query)),
    ).toEqual({
      OR: [
        { name: { contains: 'kim', mode: 'insensitive' } },
        { email: { contains: 'kim', mode: 'insensitive' } },
      ],
    });
  });

  it('combines filters with AND match', () => {
    expect(
      combineWhere(
        buildTextQueryWhere(undefined, () => []),
        buildFiltersWhere({ role: 'admin', status: 'SUCCESS' }, 'and'),
      ),
    ).toEqual({
      AND: [{ role: 'admin' }, { status: 'SUCCESS' }],
    });
  });

  it('builds string contains filter conditions', () => {
    expect(
      buildFiltersWhere({ name: 'kim', email: 'test' }, 'and', {
        name: stringContainsFilter('name'),
        email: stringContainsFilter('email'),
      }),
    ).toEqual({
      AND: [
        { name: { contains: 'kim', mode: 'insensitive' } },
        { email: { contains: 'test', mode: 'insensitive' } },
      ],
    });
  });

  it('builds unicode-aware contains filter conditions', () => {
    expect(
      buildFiltersWhere({ originalName: '뭉개' }, 'and', {
        originalName: stringContainsFilter('originalName'),
      }),
    ).toEqual({
      OR: [
        { originalName: { contains: '뭉개', mode: 'insensitive' } },
        { originalName: { contains: '뭉개', mode: 'insensitive' } },
      ],
    });
  });
});

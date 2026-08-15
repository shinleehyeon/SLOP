import { z } from 'zod';
import { PaginationQuerySchema } from '@/common/dto/pagination.dto';
import type { ListQueryConfig } from './list-query.types';
import { hasFilterEntries } from './list-query.util';

const FilterOptionsSchema = z.object({
  match: z.enum(['and', 'or']).default('and'),
});

function optionalJsonQuery<T extends z.ZodType>(label: string, schema: T) {
  return z
    .union([z.string(), schema])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) {
        return undefined;
      }

      if (typeof value === 'object') {
        return value;
      }

      if (typeof value !== 'string') {
        return value;
      }

      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label}는 유효한 JSON이어야 합니다.`,
        });

        return undefined;
      }
    })
    .pipe(schema.optional());
}

export function createListQuerySchema<TFilterSchema extends z.ZodType>(
  config: ListQueryConfig & {
    filterSchema: TFilterSchema;
  },
) {
  const { sortableFields, filterSchema } = config;

  return PaginationQuerySchema.extend({
    query: z.string().trim().min(1).optional(),
    filters: optionalJsonQuery('filters', filterSchema),
    filterOptions: optionalJsonQuery('filterOptions', FilterOptionsSchema),
    sort: z
      .string()
      .trim()
      .min(1)
      .optional()
      .refine(
        (value) => {
          if (!value) {
            return true;
          }

          const field = value.startsWith('-') ? value.slice(1) : value;

          return sortableFields.includes(field);
        },
        `sort는 ${sortableFields.join(', ')} 중 하나여야 합니다.`,
      ),
  }).superRefine((data, ctx) => {
    const hasQuery = Boolean(data.query);
    const hasFilters = hasFilterEntries(data.filters);

    if (hasQuery && hasFilters) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'query와 filters는 동시에 사용할 수 없습니다.',
        path: ['query'],
      });
    }

    if (data.filterOptions && !hasFilters) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'filterOptions는 filters와 함께 사용해야 합니다.',
        path: ['filterOptions'],
      });
    }
  });
}

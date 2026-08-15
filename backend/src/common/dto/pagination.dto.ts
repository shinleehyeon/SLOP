import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}

export class PaginationMetaDto extends createZodDto(PaginationMetaSchema) {}

export function createPaginationMeta(input: { page: number; limit: number; total: number }) {
  const totalPages = Math.ceil(input.total / input.limit);

  return {
    page: input.page,
    limit: input.limit,
    total: input.total,
    totalPages,
    hasNextPage: input.page < totalPages,
    hasPreviousPage: input.page > 1,
  };
}

export function getPaginationOffset(input: { page: number; limit: number }) {
  return (input.page - 1) * input.limit;
}

export function createPaginatedResponseSchema<TItem extends z.ZodType>(itemSchema: TItem) {
  return z.object({
    items: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}

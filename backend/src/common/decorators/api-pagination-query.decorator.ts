import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function ApiPaginationQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      schema: {
        default: 1,
        minimum: 1,
        type: 'integer',
      },
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      schema: {
        default: 20,
        maximum: 100,
        minimum: 1,
        type: 'integer',
      },
    }),
  );
}

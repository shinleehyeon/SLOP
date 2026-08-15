import { OpenAPIObject } from '@nestjs/swagger';
import { OPENAPI_ERROR_STATUSES_EXTENSION } from '@/common/decorators/api-endpoint.decorator';
import { OPENAPI_METHODS } from './openapi-methods';

interface OperationWithErrorStatuses {
  [OPENAPI_ERROR_STATUSES_EXTENSION]?: unknown;
}

export function addProblemDetailsResponses(document: OpenAPIObject) {
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const method of OPENAPI_METHODS) {
      const operation = pathItem?.[method];

      if (!operation?.responses) {
        continue;
      }

      for (const status of getProblemDetailsStatuses(operation)) {
        operation.responses[status] ??= createProblemDetailsResponse({
          status: Number(status),
          instance: createApiInstance(path),
        });
      }

      delete operation[OPENAPI_ERROR_STATUSES_EXTENSION];
    }
  }
}

function getProblemDetailsStatuses(operation: unknown) {
  const value = (operation as OperationWithErrorStatuses)[OPENAPI_ERROR_STATUSES_EXTENSION];

  if (!Array.isArray(value)) {
    return ['500'];
  }

  return [
    ...new Set(
      value
        .map((status) => Number(status))
        .filter(Number.isInteger)
        .map((status) => String(status)),
    ),
  ];
}

function createProblemDetailsResponse({ status, instance }: { status: number; instance: string }) {
  return {
    description: 'Error',
    content: {
      'application/problem+json': {
        schema: {
          $ref: '#/components/schemas/ProblemDetails',
        },
        example: createProblemDetailsExample({
          status,
          instance,
        }),
      },
    },
  };
}

function createApiInstance(path: string) {
  return path.startsWith('/api') ? path : `/api${path}`;
}

function createProblemDetailsExample({ status, instance }: { status: number; instance: string }) {
  const title = getProblemDetailsTitle(status);

  return {
    type: 'about:blank',
    title,
    status,
    detail: title,
    instance,
  };
}

function getProblemDetailsTitle(status: number) {
  switch (status) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Error';
  }
}

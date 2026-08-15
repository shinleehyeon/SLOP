import { OpenAPIObject } from '@nestjs/swagger';
import { OPENAPI_PUBLIC_EXTENSION } from '@/common/decorators/public.decorator';
import { OPENAPI_METHODS } from './openapi-methods';

export function removePublicSecurity(document: OpenAPIObject) {
  for (const pathItem of Object.values(document.paths)) {
    for (const method of OPENAPI_METHODS) {
      const operation = pathItem?.[method];

      if (!operation?.[OPENAPI_PUBLIC_EXTENSION]) {
        continue;
      }

      operation.security = [];
      delete operation[OPENAPI_PUBLIC_EXTENSION];
    }
  }
}

export function addCommonSchemas(document: OpenAPIObject, exampleTimestamp: string) {
  document.components ??= {};
  document.components.schemas ??= {};

  document.components.schemas.BaseResponse = {
    type: 'object',
    required: ['status', 'method', 'instance', 'body', 'timestamp'],
    properties: {
      status: {
        type: 'integer',
        example: 200,
      },
      method: {
        type: 'string',
        example: 'GET',
      },
      instance: {
        type: 'string',
        example: '/api/health',
      },
      body: {
        description: 'Endpoint response body',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: exampleTimestamp,
      },
    },
  };

  document.components.schemas.ProblemDetails = {
    type: 'object',
    required: ['type', 'title', 'status'],
    properties: {
      type: {
        type: 'string',
        example: 'unauthorized',
      },
      title: {
        type: 'string',
        example: 'Unauthorized',
      },
      status: {
        type: 'integer',
        example: 401,
      },
      detail: {
        type: 'string',
        example: 'Unauthorized',
      },
      instance: {
        type: 'string',
        example: '/api/users/me',
      },
    },
  };
}

export function removeZodOutputSchemaSuffix(document: OpenAPIObject) {
  const schemas = document.components?.schemas;

  if (!schemas) {
    return;
  }

  const renameMap = new Map<string, string>();

  for (const schemaName of Object.keys(schemas)) {
    if (!schemaName.endsWith('_Output')) {
      continue;
    }

    const normalizedName = schemaName.slice(0, -'_Output'.length);

    if (schemas[normalizedName]) {
      continue;
    }

    schemas[normalizedName] = schemas[schemaName];
    delete schemas[schemaName];
    renameMap.set(schemaName, normalizedName);
  }

  if (renameMap.size === 0) {
    return;
  }

  replaceSchemaRefs(document, renameMap);
}

export function removeRedundantFormatPatterns(value: unknown) {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      removeRedundantFormatPatterns(item);
    }

    return;
  }

  const record = value as Record<string, unknown>;

  if (record.format === 'email' || record.format === 'date-time') {
    delete record.pattern;
  }

  for (const child of Object.values(record)) {
    removeRedundantFormatPatterns(child);
  }
}

export function removeLegacyResponseSchemas(document: OpenAPIObject) {
  for (const pathItem of Object.values(document.paths)) {
    for (const method of OPENAPI_METHODS) {
      const operation = pathItem?.[method];

      if (!operation?.responses) {
        continue;
      }

      for (const response of Object.values(operation.responses)) {
        if (
          response &&
          typeof response === 'object' &&
          'content' in response &&
          'schema' in response
        ) {
          delete response.schema;
        }
      }
    }
  }
}

export function promoteDefaultSuccessResponses(document: OpenAPIObject) {
  for (const pathItem of Object.values(document.paths)) {
    for (const method of OPENAPI_METHODS) {
      const operation = pathItem?.[method];
      const defaultResponse = operation?.responses?.default;

      if (!defaultResponse || !hasJsonContent(defaultResponse)) {
        continue;
      }

      const successStatus = findSuccessStatus(operation.responses) ?? '200';
      operation.responses[successStatus] ??= defaultResponse;
      delete operation.responses.default;
    }
  }
}

function replaceSchemaRefs(value: unknown, renameMap: Map<string, string>) {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      replaceSchemaRefs(item, renameMap);
    }

    return;
  }

  const record = value as Record<string, unknown>;
  const ref = record.$ref;

  if (typeof ref === 'string') {
    const schemaName = ref.replace('#/components/schemas/', '');
    const renamedSchemaName = renameMap.get(schemaName);

    if (renamedSchemaName) {
      record.$ref = `#/components/schemas/${renamedSchemaName}`;
    }
  }

  for (const child of Object.values(record)) {
    replaceSchemaRefs(child, renameMap);
  }
}

function hasJsonContent(response: unknown) {
  return (
    !!response &&
    typeof response === 'object' &&
    'content' in response &&
    !!response.content &&
    typeof response.content === 'object' &&
    'application/json' in response.content
  );
}

function findSuccessStatus(responses: Record<string, unknown>) {
  return Object.keys(responses).find((status) => status.startsWith('2'));
}

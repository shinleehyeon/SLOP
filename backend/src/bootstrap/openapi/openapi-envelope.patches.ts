import { OpenAPIObject } from '@nestjs/swagger';
import { createResponseEnvelope } from '@/common/http/response-envelope';
import { OPENAPI_METHODS } from './openapi-methods';

export function wrapSuccessResponses(document: OpenAPIObject, exampleTimestamp: string) {
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const method of OPENAPI_METHODS) {
      const operation = pathItem?.[method];

      if (!operation?.responses) {
        continue;
      }

      for (const [status, response] of Object.entries(operation.responses)) {
        if (!status.startsWith('2')) {
          continue;
        }

        const mediaType =
          'content' in response ? response.content?.['application/json'] : undefined;

        if (!mediaType?.schema) {
          continue;
        }

        const bodySchema = mediaType.schema;
        const bodyExample =
          mediaType.example ?? getSchemaExample(document, bodySchema, exampleTimestamp);

        mediaType.example = createResponseEnvelope({
          status: Number(status),
          method: method.toUpperCase(),
          instance: createApiInstance(path),
          body: bodyExample,
          timestamp: exampleTimestamp,
        });

        if (mediaType.examples) {
          for (const example of Object.values(mediaType.examples)) {
            if ('$ref' in example || !('value' in example)) {
              continue;
            }

            example.value = createResponseEnvelope({
              status: Number(status),
              method: method.toUpperCase(),
              instance: createApiInstance(path),
              body: example.value,
              timestamp: exampleTimestamp,
            });
          }
        }
      }
    }
  }
}

function createApiInstance(path: string) {
  return path.startsWith('/api') ? path : `/api${path}`;
}

function getSchemaExample(
  document: OpenAPIObject,
  schema: unknown,
  exampleTimestamp: string,
): unknown {
  if (!schema || typeof schema !== 'object') {
    return null;
  }

  if ('example' in schema) {
    return schema.example;
  }

  if ('$ref' in schema && typeof schema.$ref === 'string') {
    const schemaName = schema.$ref.replace('#/components/schemas/', '');
    return getSchemaExample(document, document.components?.schemas?.[schemaName], exampleTimestamp);
  }

  if ('allOf' in schema && Array.isArray(schema.allOf)) {
    return Object.assign(
      {},
      ...schema.allOf
        .map((item) => getSchemaExample(document, item, exampleTimestamp))
        .filter(Boolean),
    );
  }

  if ('type' in schema && schema.type === 'array') {
    return [
      getSchemaExample(document, 'items' in schema ? schema.items : undefined, exampleTimestamp),
    ];
  }

  if ('type' in schema && schema.type === 'object' && 'properties' in schema) {
    return Object.fromEntries(
      Object.entries(schema.properties as Record<string, unknown>).map(([key, value]) => [
        key,
        getSchemaExample(document, value, exampleTimestamp),
      ]),
    );
  }

  if ('enum' in schema && Array.isArray(schema.enum)) {
    return schema.enum[0];
  }

  if ('format' in schema && schema.format === 'email') {
    return 'hello@example.com';
  }

  if ('format' in schema && schema.format === 'date-time') {
    return exampleTimestamp;
  }

  if ('type' in schema && schema.type === 'integer') {
    return 0;
  }

  if ('type' in schema && schema.type === 'number') {
    return 0;
  }

  if ('type' in schema && schema.type === 'boolean') {
    return true;
  }

  return 'string';
}

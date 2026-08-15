import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { OpenAPIObject } from '@nestjs/swagger';
import { registerOpenApiTagMeta } from '@/common/openapi/openapi-tag-registry';
import { applyOpenApiDocumentPatches } from './apply-openapi-document-patches';

const FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z';

function createFixtureDocument(): OpenAPIObject {
  registerOpenApiTagMeta('Users', {
    group: 'Application',
    description: '내 프로필 조회·수정·탈퇴',
  });

  return {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
    paths: {
      '/users/me': {
        get: {
          tags: ['Users', 'UsersController'],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'usr_test' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: { schemas: {} },
  };
}

describe('applyOpenApiDocumentPatches', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(FIXED_TIMESTAMP));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('matches snapshot', () => {
    const document = createFixtureDocument();

    applyOpenApiDocumentPatches(document);

    expect(document).toMatchSnapshot();
  });
});

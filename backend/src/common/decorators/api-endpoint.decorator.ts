import { applyDecorators, HttpCode } from '@nestjs/common';
import { ApiExtension, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodDto, ZodResponse } from 'nestjs-zod';
import { registerOpenApiTagMeta } from '@/common/openapi/openapi-tag-registry';
import { getApiControllerMeta, registerPendingApiEndpoint } from './api-controller.decorator';
import { Public } from './public.decorator';

export const OPENAPI_ERROR_STATUSES_EXTENSION = 'x-error-statuses';

interface ApiEndpointZodSchema {
  parse(input: unknown, options?: Record<string | number | symbol, unknown>): unknown;
  encode?(input: unknown, options?: Record<string | number | symbol, unknown>): unknown;
  array?: () => ApiEndpointZodSchema;
}

interface ApiEndpointTagOptions {
  /** OpenAPI tag — 생략 시 `@ApiController` 값 사용 */
  tag?: string;
  /** Scalar x-tagGroups — 생략 시 `@ApiController` 값 사용 */
  group?: string;
  /** OpenAPI tag description — tag override 시에만 지정 (기본 tag는 `@ApiController` description) */
  tagDescription?: string;
}

interface ApiEndpointBaseOptions extends ApiEndpointTagOptions {
  title: string;
  description?: string;
  status: number;
  isPublic?: boolean;
  deprecated?: boolean;
  errorStatuses?: number[];
}

interface ApiEndpointResponseOptions extends ApiEndpointBaseOptions {
  response: ZodDto<ApiEndpointZodSchema, false>;
  redirect?: false;
}

interface ApiEndpointRedirectOptions extends ApiEndpointBaseOptions {
  redirect: true;
  response?: never;
}

type ApiEndpointOptions = ApiEndpointResponseOptions | ApiEndpointRedirectOptions;

function resolveTagMeta(
  target: object,
  propertyKey: string | symbol,
  options: ApiEndpointTagOptions,
) {
  const controllerMeta = getApiControllerMeta(target.constructor);
  const tag = options.tag ?? controllerMeta?.tag;

  if (!tag) {
    throw new Error(
      `@ApiEndpoint on ${target.constructor.name}.${String(propertyKey)} requires a tag. ` +
        'Set @ApiController on the class or pass tag in @ApiEndpoint.',
    );
  }

  const group = options.group ?? controllerMeta?.group;

  if (!group) {
    throw new Error(
      `@ApiEndpoint on ${target.constructor.name}.${String(propertyKey)} requires a group. ` +
        'Set @ApiController on the class or pass group in @ApiEndpoint.',
    );
  }

  const inheritsControllerTag = !options.tag || options.tag === controllerMeta?.tag;
  const tagDescription =
    options.tagDescription ?? (inheritsControllerTag ? controllerMeta?.description : undefined);

  return { tag, group, tagDescription };
}

function applyApiEndpointDecorators(
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
  options: ApiEndpointOptions,
) {
  const controllerMeta = getApiControllerMeta(target.constructor);
  const { tag, group, tagDescription } = resolveTagMeta(target, propertyKey, options);

  registerOpenApiTagMeta(tag, {
    group,
    description: tagDescription,
  });

  const baseErrorStatuses = options.isPublic ? [] : [401, 403];
  const errorStatuses = [...new Set([...baseErrorStatuses, ...(options.errorStatuses ?? []), 500])];
  const decorators = [
    ApiOperation({
      summary: options.title,
      description: options.description,
      deprecated: options.deprecated,
    }),
    ApiExtension(OPENAPI_ERROR_STATUSES_EXTENSION, errorStatuses),
  ];

  if (!controllerMeta || tag !== controllerMeta.tag) {
    decorators.unshift(ApiTags(tag));
  }

  if (options.redirect) {
    decorators.push(
      ApiResponse({
        status: options.status,
        description: options.description ?? 'Redirect',
      }),
    );
  } else {
    decorators.push(
      HttpCode(options.status),
      ZodResponse({
        type: options.response,
        status: options.status,
      }),
    );
  }

  if (options.isPublic) {
    decorators.push(Public());
  }

  applyDecorators(...decorators)(target, propertyKey, descriptor);
}

export function ApiEndpoint(options: ApiEndpointOptions) {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const controllerClass = target.constructor as Function;
    const controllerMeta = getApiControllerMeta(controllerClass);

    if (!controllerMeta && !options.tag) {
      registerPendingApiEndpoint(controllerClass, {
        target,
        propertyKey,
        descriptor,
        apply: () => {
          applyApiEndpointDecorators(target, propertyKey, descriptor, options);
        },
      });
      return descriptor;
    }

    applyApiEndpointDecorators(target, propertyKey, descriptor, options);
    return descriptor;
  };
}

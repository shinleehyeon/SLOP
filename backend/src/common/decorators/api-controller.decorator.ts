import { ApiTags } from '@nestjs/swagger';
import {
  registerNestJsAutoControllerTag,
  registerOpenApiTagMeta,
} from '@/common/openapi/openapi-tag-registry';

export interface ApiControllerOptions {
  tag: string;
  group: string;
  description?: string;
}

const controllerMetaRegistry = new WeakMap<object, ApiControllerOptions>();

export function getApiControllerMeta(target: object): ApiControllerOptions | undefined {
  return controllerMetaRegistry.get(target);
}

export interface PendingApiEndpointRegistration {
  target: object;
  propertyKey: string | symbol;
  descriptor: PropertyDescriptor;
  apply: () => void;
}

const pendingApiEndpoints = new WeakMap<Function, PendingApiEndpointRegistration[]>();

export function registerPendingApiEndpoint(
  controllerClass: Function,
  registration: PendingApiEndpointRegistration,
) {
  const pending = pendingApiEndpoints.get(controllerClass) ?? [];
  pending.push(registration);
  pendingApiEndpoints.set(controllerClass, pending);
}

function flushPendingApiEndpoints(controllerClass: Function) {
  const pending = pendingApiEndpoints.get(controllerClass);
  if (!pending) {
    return;
  }

  pendingApiEndpoints.delete(controllerClass);

  for (const registration of pending) {
    registration.apply();
  }
}

/**
 * 컨트롤러 기본 OpenAPI tag/group.
 * NestJS Swagger가 클래스명으로 자동 생성하는 태그는 registry에 등록되어 문서 후처리에서 제거됩니다.
 */
export function ApiController(options: ApiControllerOptions) {
  return (target: Function) => {
    controllerMetaRegistry.set(target, options);
    registerOpenApiTagMeta(options.tag, {
      group: options.group,
      description: options.description,
    });

    const nestJsAutoTag = target.name.replace(/Controller$/, '');

    if (nestJsAutoTag !== options.tag) {
      registerNestJsAutoControllerTag(nestJsAutoTag);
    }

    ApiTags(options.tag)(target);
    flushPendingApiEndpoints(target);
  };
}

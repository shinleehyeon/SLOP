import type { IncomingMessage } from 'node:http';
import { createId } from '@paralleldrive/cuid2';

type RequestLike = {
  headers: IncomingMessage['headers'];
  id?: unknown;
};

export function resolveRequestId(request: RequestLike): string {
  const fromHeader = getHeaderValue(request.headers['x-request-id']);

  if (fromHeader) {
    setRequestId(request, fromHeader);
    return fromHeader;
  }

  if (request.id != null && request.id !== '') {
    return String(request.id);
  }

  const id = createId();
  setRequestId(request, id);
  return id;
}

function setRequestId(request: RequestLike, id: string) {
  (request as { id?: string }).id = id;
}

function getHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

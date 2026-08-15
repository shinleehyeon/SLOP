export interface ResponseEnvelope<T = unknown> {
  status: number;
  method: string;
  instance: string;
  body: T;
  timestamp: string;
}

export function createResponseEnvelope<T>({
  status,
  method,
  instance,
  body,
  timestamp = new Date().toISOString(),
}: {
  status: number;
  method: string;
  instance: string;
  body: T;
  timestamp?: string;
}): ResponseEnvelope<T> {
  return {
    status,
    method,
    instance,
    body,
    timestamp,
  };
}

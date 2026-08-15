import { Module } from '@nestjs/common';
import { Request } from 'express';
import { ClsModule } from 'nestjs-cls';
import { resolveRequestId } from '@/common/http/resolve-request-id';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, request: Request) => {
          cls.set('requestId', resolveRequestId(request));
          cls.set('ip', getRequestIp(request));
          cls.set('userAgent', getHeaderValue(request.headers['user-agent']));
        },
      },
    }),
  ],
})
export class RequestContextModule {}

function getRequestIp(request: Request) {
  return (
    getHeaderValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ??
    request.ip ??
    request.socket.remoteAddress
  );
}

function getHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

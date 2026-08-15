import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';
import { createResponseEnvelope } from '@/common/http/response-envelope';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((body) =>
        createResponseEnvelope({
          status: response.statusCode,
          method: request.method,
          instance: request.originalUrl,
          body,
        }),
      ),
    );
  }
}

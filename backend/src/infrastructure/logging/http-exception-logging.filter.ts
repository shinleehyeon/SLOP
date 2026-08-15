import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { Request } from 'express';
import { HttpExceptionFilter } from 'nest-problem-details-filter';
import { stashRequestException } from '@/common/http/request-exception';

@Catch()
export class HttpExceptionLoggingFilter implements ExceptionFilter {
  private readonly problemDetailsFilter: HttpExceptionFilter;

  constructor(httpAdapterHost: HttpAdapterHost) {
    this.problemDetailsFilter = new HttpExceptionFilter(
      httpAdapterHost,
      '',
      undefined,
      ({ status }) => status >= 500,
    );
  }

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();

    stashRequestException(request, exception);

    this.problemDetailsFilter.catch(this.toHttpException(exception), host);
  }

  private toHttpException(exception: unknown): HttpException {
    if (exception instanceof HttpException) {
      return exception;
    }

    if (exception instanceof Error) {
      return new HttpException(
        {
          message: exception.message,
          error: exception.name,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

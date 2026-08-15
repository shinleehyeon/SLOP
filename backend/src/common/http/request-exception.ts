import type { IncomingMessage } from 'node:http';
import { HttpException, HttpStatus } from '@nestjs/common';

const requestExceptionKey = Symbol('requestException');
const routeNotFoundMessagePattern = /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /;

type RequestWithException = IncomingMessage & {
  [requestExceptionKey]?: unknown;
};

type HttpExceptionBody = {
  message?: unknown;
  errors?: unknown;
  error?: unknown;
};

export type ExceptionValidationIssue = {
  path?: string;
  message?: string;
  code?: string;
};

export function stashRequestException(request: IncomingMessage, exception: unknown) {
  (request as RequestWithException)[requestExceptionKey] = exception;
}

export function getRequestException(request: IncomingMessage) {
  return (request as RequestWithException)[requestExceptionKey];
}

export function getExceptionLogSummary(exception: unknown) {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      return formatMessageValue((response as HttpExceptionBody).message) ?? 'Request failed';
    }
  }

  if (exception instanceof Error) {
    return exception.message;
  }

  return String(exception);
}

export function isRouteNotFoundException(exception: unknown) {
  if (!(exception instanceof HttpException)) {
    return false;
  }

  if (exception.getStatus() !== HttpStatus.NOT_FOUND) {
    return false;
  }

  return routeNotFoundMessagePattern.test(getExceptionLogSummary(exception));
}

export function isQuietHttpException(exception: unknown) {
  if (!(exception instanceof HttpException)) {
    return false;
  }

  const status = exception.getStatus();

  return (
    status === HttpStatus.UNAUTHORIZED ||
    status === HttpStatus.FORBIDDEN ||
    status === HttpStatus.CONFLICT ||
    status === HttpStatus.TOO_MANY_REQUESTS
  );
}

export function getHttpExceptionLogProps(request: IncomingMessage) {
  const exception = getRequestException(request);

  if (!exception || isRouteNotFoundException(exception) || isQuietHttpException(exception)) {
    return {};
  }

  const validationIssues = getExceptionValidationIssues(exception);

  if (validationIssues) {
    return { detail: formatValidationDetail(validationIssues) };
  }

  if (exception instanceof Error) {
    return { detail: formatFailureDetail(exception) };
  }

  return {};
}

function getExceptionValidationIssues(exception: unknown) {
  if (!(exception instanceof HttpException)) {
    return undefined;
  }

  const response = exception.getResponse();

  if (typeof response !== 'object' || response === null) {
    return undefined;
  }

  return normalizeValidationIssues((response as HttpExceptionBody).errors);
}

function formatValidationDetail(issues: ExceptionValidationIssue[]) {
  return issues
    .map((issue) => {
      const field = issue.path ?? 'request';
      const code = issue.code ? ` (${issue.code})` : '';

      return `    ${field} · ${issue.message ?? 'Invalid value'}${code}`;
    })
    .join('\n');
}

function formatFailureDetail(error: Error) {
  const header = `    ${error.name} · ${error.message}`;

  if (!error.stack) {
    return header;
  }

  const frames = error.stack
    .split('\n')
    .slice(1)
    .map((line) => `      ${line.trim()}`)
    .filter((line) => line.trim().length > 0)
    .join('\n');

  return frames ? `${header}\n${frames}` : header;
}

function formatMessageValue(message: unknown) {
  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.map(String).join(', ');
  }

  return undefined;
}

function normalizeValidationIssues(errors: unknown) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return undefined;
  }

  const issues = errors
    .map((issue) => normalizeValidationIssue(issue))
    .filter((issue): issue is ExceptionValidationIssue => Boolean(issue));

  return issues.length > 0 ? issues : undefined;
}

function normalizeValidationIssue(issue: unknown): ExceptionValidationIssue | undefined {
  if (typeof issue === 'string') {
    return { message: issue };
  }

  if (typeof issue !== 'object' || issue === null) {
    return { message: String(issue) };
  }

  const item = issue as { path?: unknown; field?: unknown; message?: unknown; code?: unknown };
  const path = formatIssuePath(item.path ?? item.field);
  const message = typeof item.message === 'string' ? item.message : undefined;
  const code = typeof item.code === 'string' ? item.code : undefined;

  if (!path && !message && !code) {
    return undefined;
  }

  return {
    ...(path ? { path } : {}),
    ...(message ? { message } : {}),
    ...(code ? { code } : {}),
  };
}

function formatIssuePath(path: unknown) {
  if (typeof path === 'string') {
    return path;
  }

  if (Array.isArray(path)) {
    return path.map(String).join('.');
  }

  return undefined;
}

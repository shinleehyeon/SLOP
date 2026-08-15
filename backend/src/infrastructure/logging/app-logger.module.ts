import { IncomingMessage, ServerResponse } from 'node:http';
import { Module, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Colorette } from 'colorette';
import { LoggerModule } from 'nestjs-pino';
import {
  getHttpExceptionLogProps,
  getRequestException,
  isQuietHttpException,
  isRouteNotFoundException,
} from '@/common/http/request-exception';
import { resolveRequestId } from '@/common/http/resolve-request-id';

import pinoPretty = require('pino-pretty');

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.getOrThrow<string>('app.nodeEnv') === 'production';

        return {
          forRoutes: [{ path: '{*path}', method: RequestMethod.ALL }],
          pinoHttp: isProduction
            ? {
                level: 'info',
                ...createHttpLogOptions(),
              }
            : [
                {
                  level: 'debug',
                  ...createHttpLogOptions(),
                },
                createPrettyLogStream(),
              ],
          renameContext: 'context',
        };
      },
    }),
  ],
})
export class AppLoggerModule {}

function createPrettyLogStream() {
  return pinoPretty({
    colorize: true,
    levelFirst: true,
    ignore: 'pid,hostname,context,req,res,responseTime,detail,err',
    singleLine: false,
    translateTime: 'SYS:HH:MM:ss.l',
    customPrettifiers: {
      level: (level) => colorizeLevelLabel(String(level)),
    },
    messageFormat: (log, messageKey, _levelLabel, { colors }) => {
      const message = colorizeLogMessage(String(log[messageKey] ?? ''), colors);
      const context = log.context ? `${colorizeContext(String(log.context), colors)} ` : '';
      const detail =
        typeof log.detail === 'string'
          ? `\n${colorizeFailureDetail(String(log.detail), colors)}`
          : '';

      return `${context}${message}${detail}`;
    },
  });
}

function createHttpLogOptions() {
  return {
    customErrorMessage: (request: IncomingMessage, response: ServerResponse) =>
      formatHttpLogMessage(request, response.statusCode, null),
    customErrorObject: (
      request: IncomingMessage,
      _response: ServerResponse,
      _error: Error,
      value,
    ) => ({
      ...value,
      err: undefined,
      ...getHttpExceptionLogProps(request),
    }),
    customLogLevel: (
      request: IncomingMessage,
      response: ServerResponse,
      error: Error | undefined,
    ) => {
      if (error) {
        return 'error';
      }

      if (response.statusCode >= 500) {
        return 'error';
      }

      if (response.statusCode >= 400) {
        const exception = getRequestException(request);

        if (exception && (isRouteNotFoundException(exception) || isQuietHttpException(exception))) {
          return 'info';
        }

        return 'warn';
      }

      return 'info';
    },
    customSuccessMessage: (
      request: IncomingMessage,
      response: ServerResponse,
      responseTime: number,
    ) => formatHttpLogMessage(request, response.statusCode, responseTime),
    customSuccessObject: (request: IncomingMessage, _response: ServerResponse, value) => ({
      ...value,
      ...getHttpExceptionLogProps(request),
    }),
    genReqId: (request: IncomingMessage) => resolveRequestId(request),
    serializers: {
      err: () => undefined,
      req: (request: IncomingMessage & { id?: string | number }) => ({
        id: request.id,
        method: request.method,
        url: getRequestUrl(request),
      }),
      res: (response: ServerResponse) => ({
        statusCode: response.statusCode,
      }),
    },
  };
}

function formatHttpLogMessage(
  request: IncomingMessage & { id?: unknown },
  statusCode: number,
  responseTime: number | null,
) {
  const method = (request.method ?? 'GET').padEnd(7);
  const url = getRequestUrl(request);
  const status = String(statusCode).padStart(3);
  const timing = responseTime === null ? '' : `  ${String(responseTime).padStart(4)}ms`;
  const requestId = request.id ? `  ~${shortId(String(request.id))}` : '';

  return `HTTP  ${method}${url}  ${status}${timing}${requestId}`;
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(-8) : id;
}

function colorizeFailureDetail(detail: string, colors: Colorette) {
  return detail
    .split('\n')
    .map((line) => colorizeDetailLine(line, colors))
    .join('\n');
}

function colorizeDetailLine(line: string, colors: Colorette) {
  const trimmed = line.trimEnd();

  if (trimmed.startsWith('at ')) {
    return colors.gray(line);
  }

  if (line.includes(' · ')) {
    const indent = line.slice(0, line.indexOf(trimmed));
    const rest = trimmed;

    if (rest.endsWith(' · on')) {
      const name = rest.slice(0, -' · on'.length);

      return `${indent}${colors.white(name)}${colors.gray(' · ')}${colors.green('on')}`;
    }

    if (rest.endsWith(' · off')) {
      const name = rest.slice(0, -' · off'.length);

      return `${indent}${colors.gray(name)}${colors.gray(' · ')}off`;
    }

    const separatorIndex = rest.indexOf(' · ');
    const label = rest.slice(0, separatorIndex);
    const message = rest.slice(separatorIndex + 3);

    return `${indent}${colors.yellow(label)}${colors.gray(' · ')}${colors.white(message)}`;
  }

  return colors.yellow(line);
}

function getRequestUrl(request: IncomingMessage) {
  return (request as IncomingMessage & { originalUrl?: string }).originalUrl ?? request.url ?? '';
}

function colorizeLevelLabel(level: string) {
  const normalized = resolvePinoLevelLabel(level);

  if (normalized === 'DEBUG' || normalized === 'TRACE') {
    return colorize.gray(normalized.padEnd(5));
  }

  if (normalized === 'INFO') {
    return colorize.green(normalized.padEnd(5));
  }

  if (normalized === 'WARN') {
    return colorize.yellow(normalized.padEnd(5));
  }

  if (normalized === 'ERROR' || normalized === 'FATAL') {
    return colorize.red(normalized.padEnd(5));
  }

  return normalized.padEnd(5);
}

function resolvePinoLevelLabel(level: string) {
  const pinoLevelLabels: Record<string, string> = {
    '10': 'TRACE',
    '20': 'DEBUG',
    '30': 'INFO',
    '40': 'WARN',
    '50': 'ERROR',
    '60': 'FATAL',
  };

  return pinoLevelLabels[level] ?? level.toUpperCase();
}

function colorizeContext(context: string, colors: Colorette) {
  const label = `[${context}]`;

  if (context === 'RouterExplorer') {
    return colors.blue(label);
  }

  if (context === 'RoutesResolver') {
    return colors.magenta(label);
  }

  if (context === 'NestApplication') {
    return colors.green(label);
  }

  if (context === 'Bootstrap') {
    return colors.magenta(label);
  }

  if (context === 'InstanceLoader') {
    return colors.cyan(label);
  }

  if (context === 'LegacyRouteConverter' || context === 'ClsModule') {
    return colors.gray(label);
  }

  if (context.endsWith('Controller')) {
    return colors.cyan(label);
  }

  if (context.endsWith('Service')) {
    return colors.yellow(label);
  }

  return colors.gray(label);
}

function colorizeLogMessage(message: string, colors: Colorette) {
  if (message.startsWith('HTTP  ')) {
    return colorizeHttpLogLine(message, colors);
  }

  if (message.startsWith('Runtime · ')) {
    const environment = message.slice('Runtime · '.length);

    return `${colors.cyan('Runtime')}${colors.gray(' · ')}${colorizeEnvironment(environment, colors)}`;
  }

  return message
    .replace(/\b(GET|POST|PATCH|PUT|DELETE)\b/g, (method) => colorizeHttpMethod(method, colors))
    .replace(
      /->\s(\d{3})/g,
      (_match, statusCode: string) => `-> ${colorizeStatusCode(statusCode, colors)}`,
    )
    .replace(/\b(\d+)ms\b/g, (_match, duration: string) => colors.gray(`${duration}ms`));
}

function colorizeHttpLogLine(message: string, colors: Colorette) {
  const match = message.match(
    /^HTTP {2}(\S+)\s+(\S+)\s+(\d{3})(?:\s+(\d+)ms)?(?:\s+~([a-zA-Z0-9]+))?$/,
  );

  if (!match) {
    return colors.gray('HTTP  ') + message.slice(5);
  }

  const [, method, url, status, duration, requestId] = match;
  const parts = [
    colors.gray('HTTP  '),
    `${colorizeHttpMethod(method, colors)}${' '.repeat(Math.max(1, 7 - method.length))}`,
    colors.white(url),
    '  ',
    colorizeStatusCode(status, colors).padStart(3),
  ];

  if (duration) {
    parts.push(colors.gray(`  ${duration.padStart(4)}ms`));
  }

  if (requestId) {
    parts.push(colors.gray(`  ~${requestId}`));
  }

  return parts.join('');
}

function colorizeHttpMethod(method: string, colors: Colorette) {
  if (method === 'GET') {
    return colors.blue(method);
  }

  if (method === 'POST') {
    return colors.green(method);
  }

  if (method === 'PATCH' || method === 'PUT') {
    return colors.yellow(method);
  }

  if (method === 'DELETE') {
    return colors.red(method);
  }

  return method;
}

function colorizeStatusCode(statusCode: string, colors: Colorette) {
  if (statusCode.startsWith('2')) {
    return colors.green(statusCode);
  }

  if (statusCode.startsWith('3')) {
    return colors.cyan(statusCode);
  }

  if (statusCode.startsWith('4')) {
    return colors.yellow(statusCode);
  }

  if (statusCode.startsWith('5')) {
    return colors.red(statusCode);
  }

  return statusCode;
}

function colorizeEnvironment(environment: string, colors: Colorette) {
  if (environment === 'production') {
    return colors.red(environment);
  }

  if (environment === 'development') {
    return colors.green(environment);
  }

  if (environment === 'test') {
    return colors.yellow(environment);
  }

  return colors.white(environment);
}

const colorize = {
  gray: (value: string) => `\x1b[90m${value}\x1b[0m`,
  green: (value: string) => `\x1b[32m${value}\x1b[0m`,
  yellow: (value: string) => `\x1b[33m${value}\x1b[0m`,
  red: (value: string) => `\x1b[31m${value}\x1b[0m`,
};

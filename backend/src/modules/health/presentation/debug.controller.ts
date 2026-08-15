import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { OPENAPI_GROUPS, OPENAPI_TAGS } from '@/common/openapi/openapi-meta';
import { DebugErrorTriggerHelpDto } from './dto/debug-error-trigger.dto';
import { DebugValidateRequestDto, DebugValidateResponseDto } from './dto/debug-validate.dto';
import { DevOnlyGuard } from './guards/dev-only.guard';

const DEBUG_ERROR_KINDS = ['400', '401', '403', '404', '500', 'unhandled'] as const;

type DebugErrorKind = (typeof DEBUG_ERROR_KINDS)[number];

@SkipThrottle({ default: true })
@UseGuards(DevOnlyGuard)
@Controller('debug')
@ApiController({
  tag: OPENAPI_TAGS.debug,
  group: OPENAPI_GROUPS.system,
  description: '개발용 디버그 API',
})
export class DebugController {
  @Post('validate')
  @ApiEndpoint({
    title: 'validation 로깅 테스트',
    description:
      'name, email body를 검증합니다. 잘못된 값이면 400 validation 에러와 로그를 확인할 수 있습니다. production에서는 404입니다.',
    status: 200,
    response: DebugValidateResponseDto,
    errorStatuses: [400],
    isPublic: true,
  })
  validate(@Body() dto: DebugValidateRequestDto) {
    return {
      ok: true as const,
      name: dto.name,
      email: dto.email,
    };
  }

  @Get('error')
  @ApiEndpoint({
    title: '에러 로깅 테스트',
    description:
      'kind 쿼리 없으면 사용 가능한 에러 종류를 반환합니다. kind를 지정하면 해당 HTTP/서버 에러를 발생시킵니다. production에서는 404입니다.',
    status: 200,
    response: DebugErrorTriggerHelpDto,
    errorStatuses: [400, 401, 403, 404, 500],
    isPublic: true,
  })
  triggerError(@Query('kind') kind?: string) {
    if (!kind) {
      return {
        kinds: [...DEBUG_ERROR_KINDS],
        usage: '/debug/error?kind=500',
      };
    }

    this.throwDebugError(kind);
  }

  private throwDebugError(kind: string): never {
    switch (kind as DebugErrorKind) {
      case '400':
        throw new BadRequestException('Debug bad request');
      case '401':
        throw new UnauthorizedException('Debug unauthorized');
      case '403':
        throw new ForbiddenException('Debug forbidden');
      case '404':
        throw new NotFoundException('Debug not found');
      case '500':
        throw new InternalServerErrorException('Debug internal server error');
      case 'unhandled':
        throw new Error('Debug unhandled error');
      default:
        throw new BadRequestException(
          `Unknown kind "${kind}". Use one of: ${DEBUG_ERROR_KINDS.join(', ')}`,
        );
    }
  }
}

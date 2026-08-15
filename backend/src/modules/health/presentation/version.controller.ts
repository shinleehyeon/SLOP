import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { getAppVersion } from '@/common/app-version';
import { ApiController } from '@/common/decorators/api-controller.decorator';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { SYSTEM_HEALTH_API_CONTROLLER } from '@/common/openapi/openapi-meta';
import { VersionResponseDto } from './dto/version-response.dto';

@SkipThrottle({ default: true })
@Controller('version')
@ApiController({
  ...SYSTEM_HEALTH_API_CONTROLLER,
  description: 'package.json 애플리케이션 버전',
})
export class VersionController {
  @Get()
  @ApiEndpoint({
    title: '버전 조회',
    description: 'package.json의 현재 애플리케이션 버전을 반환합니다.',
    status: 200,
    response: VersionResponseDto,
    isPublic: true,
  })
  version() {
    return {
      version: getAppVersion(),
    };
  }
}

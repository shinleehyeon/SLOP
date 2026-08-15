import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate() {
    if (this.configService.getOrThrow<string>('app.nodeEnv') === 'production') {
      throw new NotFoundException();
    }

    return true;
  }
}

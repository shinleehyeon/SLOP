import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';
import { ALLOW_AI_SERVICE_AUTH_KEY } from '@/common/decorators/allow-ai-service-auth.decorator';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { AiServiceAuthService } from '@/infrastructure/auth/ai-service-auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
    private readonly aiServiceAuthService: AiServiceAuthService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const allowAiServiceAuth = this.reflector.getAllAndOverride<boolean>(
      ALLOW_AI_SERVICE_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowAiServiceAuth) {
      const request = context.switchToHttp().getRequest();

      if (this.aiServiceAuthService.tryAuthenticate(request)) {
        const expressUser = request.user as Express.User | undefined;

        if (expressUser?.id) {
          this.cls.set('userId', expressUser.id);
        }

        return true;
      }
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = Express.User>(
    error: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ) {
    const authenticatedUser = super.handleRequest(error, user, info, context, status) as TUser;
    const expressUser = authenticatedUser as Express.User | undefined;

    if (expressUser?.id) {
      this.cls.set('userId', expressUser.id);
    }

    return authenticatedUser;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersRepository } from '@/modules/users/infrastructure/users.repository';
import { AuthenticatedUser, JwtPayload } from '../application/jwt-payload';
import { toRbacRole } from '../application/user-role.mapper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('jwt.access.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid user session');
    }

    const role = toRbacRole(user.role);

    return {
      id: user.id,
      email: user.email,
      role,
      roles: [role],
    };
  }
}

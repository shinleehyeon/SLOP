import { forwardRef, Module } from '@nestjs/common';
import { AuthCoreModule } from '@/modules/auth/auth-core.module';
import { FilesModule } from '../files/files.module';
import { UsersService } from './application/users.service';
import { UserOAuthRepository } from './infrastructure/user-oauth.repository';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [FilesModule, forwardRef(() => AuthCoreModule)],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UserOAuthRepository],
  exports: [UsersRepository, UserOAuthRepository, UsersService],
})
export class UsersModule {}

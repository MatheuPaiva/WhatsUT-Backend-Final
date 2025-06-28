import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepository } from './csv-user.repository';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [UsersService, UserRepository],
  exports: [UsersService, UserRepository],
  controllers: [UsersController],
})
export class UsersModule {}

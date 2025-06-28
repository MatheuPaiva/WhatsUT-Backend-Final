import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { GroupModule } from './group/group.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [AuthModule, UsersModule, ConfigModule.forRoot(), GroupModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

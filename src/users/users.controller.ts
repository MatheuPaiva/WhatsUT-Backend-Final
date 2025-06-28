import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRepository } from './csv-user.repository';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OnlineUsersService } from 'src/auth/online-users.service';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly onlineUsers: OnlineUsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    example: [
      {
        id: '32ae172a-4b7b-44a5-a0c9-082f760af1cf',
        name: 'Rafael Lechensque',
        isCurrentUser: true,
        isOnline: true,
      },
    ],
  })
  @Get()
  async findAll(@Request() req) {
    const allUsers = await this.userRepo.findAll();

    return allUsers.map((user) => ({
      id: user.id,
      name: user.name,
      isCurrentUser: user.id === req.user.id,
      isOnline: this.onlineUsers.isOnline(user.id),
    }));
  }
}

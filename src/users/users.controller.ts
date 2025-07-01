// Arquivo: src/users/users.controller.ts

import { Controller, Get, UseGuards, Request, Patch, Param, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRepository } from './csv-user.repository';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OnlineUsersService } from 'src/auth/online-users.service';
import { UsersService } from './users.service'; // NOVO: Importar UsersService

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly onlineUsers: OnlineUsersService,
    private readonly usersService: UsersService, // NOVO: Injetar UsersService
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
      banned: user.banned || false, // NOVO: Incluir status de banido
    }));
  }

  // NOVO ENDPOINT: Banir um usuário
  // Em uma aplicação real, este endpoint exigiria uma verificação de permissão de administrador.
  @Patch('ban/:userId')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content para sucesso sem retorno de corpo
  @ApiResponse({ status: 204, description: 'Bane um usuário da aplicação' })
  async banUser(@Request() req, @Param('userId') userIdToBan: string) {
    // Exemplo de verificação básica: um usuário não pode banir a si mesmo
    if (req.user.id === userIdToBan) {
      throw new ForbiddenException('Você não pode banir a si mesmo.');
    }
    // TODO: Adicionar lógica de autorização mais robusta aqui (ex: verificar se req.user.role é 'admin')

    await this.usersService.updateBanStatus(userIdToBan, true);
    // Não retorna conteúdo para 204
  }

  // NOVO ENDPOINT: Desbanir um usuário
  // Em uma aplicação real, este endpoint exigiria uma verificação de permissão de administrador.
  @Patch('unban/:userId')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content para sucesso sem retorno de corpo
  @ApiResponse({ status: 204, description: 'Desbane um usuário da aplicação' })
  async unbanUser(@Request() req, @Param('userId') userIdToUnban: string) {
    // Exemplo de verificação básica: um usuário não pode desbanir a si mesmo
    if (req.user.id === userIdToUnban) {
      throw new ForbiddenException('Você não pode desbanir a si mesmo.');
    }
    // TODO: Adicionar lógica de autorização mais robusta aqui (ex: verificar se req.user.role é 'admin')

    await this.usersService.updateBanStatus(userIdToUnban, false);
    // Não retorna conteúdo para 204
  }
}
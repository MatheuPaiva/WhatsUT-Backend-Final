// Arquivo: src/group/group.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  ForbiddenException,
  UseGuards,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupRepository } from './group.repository';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CreateGroupDto } from './dto/create-group.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('group')
export class GroupController {
  constructor(private readonly groupRepo: GroupRepository) {}

  @Get('my')
  async myGroups(@Request() req) {
    return await this.groupRepo.findMyGroups(req.user.id);
  }

  @Get()
  async findAll() {
    return await this.groupRepo.findAll();
  }

  @Post('create')
  async create(
    @Request() req,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    const { id }: { id: string } = req.user;


    const members = createGroupDto.members || [];
    if (!members.includes(id)) {
      members.push(id);
    }

    const adminsId = createGroupDto.adminsId || [];
    if (!adminsId.includes(id)) {
      adminsId.push(id);
    }

    return await this.groupRepo.create({
      ...createGroupDto,
      members,
      adminsId,
    });
  }

  @Patch(':id/join')
  @ApiResponse({ description: 'Pedir para entrar em um grupo' })
  async join(@Request() req, @Param('id') groupId: string) {
    const { id: userId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    if (group.pendingRequests.includes(userId) || group.members.includes(userId)) {
      throw new ForbiddenException(
        'Usuário já é membro ou tem uma solicitação pendente.',
      );
    }

    group.pendingRequests.push(userId);
    return await this.groupRepo.update(group);
  }

  @Patch(':id/approve/:userId')
  @ApiResponse({ description: 'Aprovar um usuário para entrar no grupo' })
  async approve(
    @Request() req,
    @Param('id') groupId: string,
    @Param('userId') userIdToApprove: string,
  ) {
    const { id: adminId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    if (!group.adminsId.includes(adminId)) {
      throw new ForbiddenException('Apenas administradores podem aprovar membros');
    }
    if (!group.pendingRequests.includes(userIdToApprove)) {
      throw new ForbiddenException(
        'Este usuário não possui uma solicitação pendente.',
      );
    }

    group.members.push(userIdToApprove);
    group.pendingRequests = group.pendingRequests.filter((id) => id !== userIdToApprove);
    return await this.groupRepo.update(group);
  }

  @Patch(':id/reject/:userId')
  @ApiResponse({ description: 'Rejeitar um usuário pendente' })
  async reject(
    @Request() req,
    @Param('id') groupId: string,
    @Param('userId') userIdToReject: string,
  ) {
    const { id: adminId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    if (!group.adminsId.includes(adminId)) {
      throw new ForbiddenException('Apenas administradores podem rejeitar membros');
    }

    group.pendingRequests = group.pendingRequests.filter((id) => id !== userIdToReject);
    return await this.groupRepo.update(group);
  }

  @Patch(':id/ban/:userId')
  @ApiResponse({ description: 'Banir um membro do grupo' })
  async ban(
    @Request() req,
    @Param('id') groupId: string,
    @Param('userId') userIdToBan: string,
  ) {
    const { id: adminId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    if (!group.adminsId.includes(adminId)) {
      throw new ForbiddenException('Apenas administradores podem banir membros.');
    }
    if (!group.members.includes(userIdToBan)) {
      throw new ForbiddenException('Usuário não é membro deste grupo.');
    }
    if (adminId === userIdToBan) {
      throw new ForbiddenException('Um administrador não pode se banir.');
    }

    group.members = group.members.filter((id) => id !== userIdToBan);
    group.adminsId = group.adminsId.filter((id) => id !== userIdToBan);

    return await this.groupRepo.update(group);
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Sair de um grupo' })
  async leaveGroup(@Request() req, @Param('id') groupId: string) {
    const { id: userId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    if (!group.members.includes(userId)) {
      throw new ForbiddenException('Usuário não é membro deste grupo');
    }

    group.members = group.members.filter((id) => id !== userId);

    if (group.adminsId.includes(userId)) {
      group.adminsId = group.adminsId.filter((id) => id !== userId);

      if (group.adminsId.length === 0) {
        if (group.lastAdminRule === 'delete' || group.members.length === 0) {
          await this.groupRepo.delete(groupId);
          return;
        }
        else if (group.lastAdminRule === 'promote' && group.members.length > 0) {
          group.adminsId.push(group.members[0]);
        }
      }
    }

    await this.groupRepo.update(group);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Excluir um grupo' })
  async deleteGroup(@Request() req, @Param('id') groupId: string) {
    const { id: userId }: { id: string } = req.user;

    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new ForbiddenException('Grupo não encontrado.');
    }

    if (!group.adminsId.includes(userId)) {
      throw new ForbiddenException('Apenas administradores podem excluir o grupo.');
    }

    await this.groupRepo.delete(groupId);
  }


  @Patch('ban-user/:userId')
  @ApiResponse({ description: 'Requisitar o banimento de um usuário da aplicação (simulado)' })
  async banUserFromApp(@Request() req, @Param('userId') userIdToBan: string) {
    console.log(
      `O usuário ${req.user.name} (${req.user.id}) requisitou o banimento do usuário ${userIdToBan}`,
    );
    return {
      message: `Requisição para banir o usuário ${userIdToBan} foi registrada.`,
    };
  }
}
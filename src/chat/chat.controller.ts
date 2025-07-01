// Arquivo: src/chat/chat.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ChatRepository } from './chat.repository';
import { MessageDto } from './dto/create-message';
import { CreateChatDto } from './dto/create-chat.dto'; // Importe CreateChatDto

@Controller('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatRepo: ChatRepository) {}

  @Get('private/:userId')
  async getPrivateMessages(@Request() req, @Param('userId') otherId: string) {
    return this.chatRepo.findPrivateChat(req.user.id, otherId);
  }
  @Get('group/:groupId')
  async getGroupMessages(@Request() req, @Param('groupId') otherId: string) {
    return this.chatRepo.findGroupChat(otherId);
  }

  @Post('private/:userId')
  async sendoPrivate(
    @Request() req,
    @Param('userId') userId: string,
    @Body() { menssagem }: MessageDto,
  ) {
    const id: string = req.user.id;
    return await this.chatRepo.send({
      chatType: 'private',
      content: menssagem,
      senderId: id,
      targetId: userId,
    });
  }
  @Post('group/:groupId')
  async sendoGroup(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() { menssagem }: MessageDto,
  ) {
    const id: string = req.user.id;
    return await this.chatRepo.send({
      chatType: 'group',
      content: menssagem,
      senderId: id,
      targetId: groupId,
    });
    
  }
  @Post('private/:userId/file')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async sendPrivateFile(
    @Request() req,
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const id: string = req.user.id;
    console.log("sendPrivateFile (Controller): File object received by Multer:", file);
    console.log("sendPrivateFile (Controller): File path:", file.path); 
    
    // CORREÇÃO AQUI: Explicitamente tipar messageToSend como CreateChatDto
    const messageToSend: CreateChatDto = { 
      chatType: 'private', 
      content: file.path, 
      senderId: id,
      targetId: userId,
      isArquivo: true,
    };
    
    console.log("sendPrivateFile (Controller): Message object to ChatRepository.send:", messageToSend);
    return await this.chatRepo.send(messageToSend);
  }
}
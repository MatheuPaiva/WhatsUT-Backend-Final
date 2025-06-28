import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateChatDto {
  //   @ApiProperty({
  //     example: 'Oi meu chapa',
  //   })
  //   @IsNotEmpty()
  // //   senderId: string;
  //   content: string;
  //   timestamp: Date;
  //   chatType: 'private' | 'group';
  //   targetId: string;
  senderId: string;
  content: string;
  chatType: 'private' | 'group';
  targetId: string;
  isArquivo?: boolean; 
}

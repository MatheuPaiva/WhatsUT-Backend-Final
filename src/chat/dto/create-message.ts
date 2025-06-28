import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class MessageDto {
  @ApiProperty({
    example: 'Oi meu chapa',
  })
  @IsNotEmpty()
  menssagem: string;
}

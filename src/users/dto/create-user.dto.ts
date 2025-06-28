import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
export class CreateUserDto {
  @ApiProperty({
    example: 'Rafael Lechensque',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'senha123',
  })
  @IsNotEmpty()
  password: string;
}

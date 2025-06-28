import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { LastAdminRule } from '../entities/group.entity';

export class CreateGroupDto {
  @ApiProperty({
    example: 'Jogo do bicho',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: ['bb145801-dd77-4e34-bdea-bee5dd790f3e'],
  })
  adminsId: string[];

  @ApiProperty({
    example: [
      'bb145801-dd77-4e34-bdea-bee5dd790f3e',
      '6ee878d0-e36c-4596-a249-46f2cd948146',
    ],
  })
  members: string[];


@ApiProperty({
  description: "Regra para quando o último admin sair: 'promote' ou 'delete'",
  example: 'promote',
  required: false, // O campo é opcional
  enum: ['promote', 'delete'],
})
@IsOptional()
@IsIn(['promote', 'delete'])
lastAdminRule?: LastAdminRule;
}
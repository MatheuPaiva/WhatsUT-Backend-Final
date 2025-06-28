import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateGroupDto } from './create-group.dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @ApiProperty({
    example: [
      'bb145801-dd77-4e34-bdea-bee5dd790f3e',
      '6ee878d0-e36c-4596-a249-46f2cd948146',
    ],
  })
  pendingRequests?: string[];
}

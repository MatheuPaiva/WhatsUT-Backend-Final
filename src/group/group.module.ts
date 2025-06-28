import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { GroupRepository } from './group.repository';

@Module({
  controllers: [GroupController],
  providers: [GroupService, GroupRepository],
})
export class GroupModule {}

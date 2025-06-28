import { Injectable } from '@nestjs/common';
import { Group, LastAdminRule } from './entities/group.entity';
import { v4 } from 'uuid';
import { parse, writeToPath } from 'fast-csv';
import * as fs from 'fs';
import * as path from 'path';
import { CreateGroupDto } from './dto/create-group.dto';

export const CSV_FILE_GROUP = path.resolve(__dirname, '../../data/groups.csv');

export const CSV_HEADERS_GROUP =
  'id,name,adminsId,members,pendingRequests,lastAdminRule\n';

@Injectable()
export class GroupRepository {
 
  private async readAllGroupsFromCsv(): Promise<Group[]> {
    return new Promise((resolve, reject) => {
      const groups: Group[] = [];
      fs.createReadStream(CSV_FILE_GROUP)
        .pipe(parse({ headers: true }))
        .on('error', reject)
        .on('data', (row) => {
          
          const group: Group = {
            id: row.id,
            name: row.name,
            adminsId: row.adminsId ? row.adminsId.split(';') : [],
            members: row.members ? row.members.split(';') : [],
            pendingRequests: row.pendingRequests
              ? row.pendingRequests.split(';')
              : [],
            
            lastAdminRule:
              row.lastAdminRule === 'delete' ? 'delete' : 'promote',
          };
          groups.push(group);
        })
        .on('end', () => resolve(groups));
    });
  }

 
  private async writeGroupsToCsv(groups: Group[]): Promise<void> {
    const rows = groups.map((g) => ({
      id: g.id,
      name: g.name,
      adminsId: g.adminsId.join(';'),
      members: g.members.join(';'),
      pendingRequests: g.pendingRequests.join(';'),
      lastAdminRule: g.lastAdminRule, 
    }));

    return new Promise<void>((resolve, reject) => {
      writeToPath(CSV_FILE_GROUP, rows, { headers: true })
        .on('error', reject)
        .on('finish', resolve);
    });
  }

  async findAll(): Promise<Group[]> {
    return await this.readAllGroupsFromCsv();
  }

  async findMyGroups(userId: string): Promise<Group[]> {
    const allGroups = await this.findAll();
    return allGroups.filter((group) => group.members.includes(userId));
  }

  async findById(id: string): Promise<Group | undefined> {
    const allGroups = await this.findAll();
    return allGroups.find((group) => group.id === id);
  }

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const newGroup: Group = {
      id: v4(),
      name: createGroupDto.name,
      adminsId: createGroupDto.adminsId,
      members: createGroupDto.members,
      pendingRequests: [],
      
      lastAdminRule: createGroupDto.lastAdminRule || 'promote',
    };

    const allGroups = await this.findAll();
    allGroups.push(newGroup);

    await this.writeGroupsToCsv(allGroups);
    return newGroup;
  }

  async update(updatedGroup: Group): Promise<Group> {
    const allGroups = await this.findAll();
    const groupIndex = allGroups.findIndex((g) => g.id === updatedGroup.id);

    if (groupIndex === -1) {
      throw new Error('Grupo não encontrado para atualização');
    }

    allGroups[groupIndex] = updatedGroup;
    await this.writeGroupsToCsv(allGroups);

    return updatedGroup;
  }

  async delete(groupId: string): Promise<void> {
    const allGroups = await this.findAll();
    const updatedGroups = allGroups.filter((g) => g.id !== groupId);
    await this.writeGroupsToCsv(updatedGroups);
  }
}
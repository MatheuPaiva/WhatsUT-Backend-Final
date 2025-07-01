// Arquivo: src/users/csv-user.repository.ts

import { Injectable } from '@nestjs/common';
import { User } from './entities/users.entity';
import * as fs from 'fs';
import * as path from 'path';
import { parse, writeToStream } from 'fast-csv';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 } from 'uuid';

export const CSV_FILE_USER = path.resolve(__dirname, '../../data/users.csv');
export const CSV_HEADERS_USER = 'id,name,password,banned\n'; // ATUALIZADO: Adicionado 'banned'

@Injectable()
export class UserRepository {
  async findAll(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      const users: User[] = [];
      fs.createReadStream(CSV_FILE_USER)
        .pipe(parse({ headers: true }))
        .on('error', reject)
        .on('data', (row) => users.push({
            id: row.id,
            name: row.name,
            password: row.password,
            banned: row.banned === 'true' // NOVO: Converte 'true'/'false' de volta para boolean
        }))
        .on('end', () => resolve(users));
    });
  }

  async findByName(name: string): Promise<User | undefined> {
    const users = (await this.findAll()).find((user) => user.name === name);
    return users;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user: User = {
      id: v4(),
      name: dto.name,
      password: dto.password,
      banned: false, // NOVO: Usuário não é banido por padrão na criação
    };

    // ATUALIZADO: Inclui o campo 'banned' na linha a ser escrita
    const row = [[user.id, user.name, user.password, user.banned ? 'true' : 'false']];

    await new Promise((resolve, reject) => {
      const writableStream = fs.createWriteStream(CSV_FILE_USER, {
        flags: 'a',
      });
      writeToStream(writableStream, row, {
        headers: false,
        includeEndRowDelimiter: true,
      })
        .on('error', reject)
        .on('finish', () => resolve(undefined));
    });

    return user;
  }

  // NOVO MÉTODO: Para atualizar um usuário (necessário para mudar o status de banido)
  async update(userToUpdate: User): Promise<User> {
    const allUsers = await this.findAll();
    const userIndex = allUsers.findIndex(u => u.id === userToUpdate.id);

    if (userIndex === -1) {
        throw new Error('Usuário não encontrado para atualização.');
    }

    allUsers[userIndex] = userToUpdate;

    // Reescreve todo o CSV com os dados atualizados
    await new Promise<void>((resolve, reject) => {
        const rows = allUsers.map(u => [u.id, u.name, u.password, u.banned ? 'true' : 'false']);
        writeToStream(fs.createWriteStream(CSV_FILE_USER), rows, { headers: true, writeHeaders: true })
            .on('error', reject)
            .on('finish', resolve);
    });

    return userToUpdate;
  }
}
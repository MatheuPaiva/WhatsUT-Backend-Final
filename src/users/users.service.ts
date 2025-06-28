import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './csv-user.repository';
import * as bcrypt from 'bcrypt';
// This should be a real class/interface representing a user entity

@Injectable()
export class UsersService {
  constructor(private usersRepo: UserRepository) {}

  async findOne(username: string) {
    return this.usersRepo.findByName(username);
  }

  async create({ name, password }: CreateUserDto) {
    const exitUser = await this.usersRepo.findByName(name);
    if (exitUser) throw new ConflictException('Usario ja cadastrado');
    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(password, salt);
    const { id, name: a } = await this.usersRepo.create({
      name,
      password: hashed,
    });

    return a;
  }
}

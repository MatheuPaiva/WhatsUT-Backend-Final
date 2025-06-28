import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { OnlineUsersService } from './online-users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private onlineUsers: OnlineUsersService,
  ) {}

  async register(createUser: CreateUserDto) {
    return this.usersService.create(createUser);
  }

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);
    // if (user?.password !== pass) {
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.onlineUsers.addUser(user.id);

    const payload = { name: user.name, sub: user.id };
    return { access_token: this.jwtService.sign(payload) };
  }

  async singOut(id: string) {
    this.onlineUsers.removeUser(id);
    return 'Sucesso';
  }
}

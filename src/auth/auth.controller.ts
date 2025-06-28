import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OnlineUsersService } from './online-users.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login do usuário' })
  @Post('login')
  async signIn(@Body() signInDto: CreateUserDto) {
    return this.authService.signIn(signInDto.name, signInDto.password);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async singOut(@Request() req) {
    return this.authService.singOut(req.user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('register')
  async register(@Body() body: CreateUserDto) {
    return this.authService.register(body);
  }

  @ApiBearerAuth()
  @ApiResponse({
    example: {
      id: '98c24db0-532e-4b47-88c1-7572be9d7f05',
      name: 'Rafael Lechensque',
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}

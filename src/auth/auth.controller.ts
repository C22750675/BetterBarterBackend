import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterUserDto } from 'src/users/dtos/register-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserPayloadDto } from './dto/user-payload.dto';
import { GetUser } from './decorators/get-user.decorator';
import { LoginUserDto } from 'src/users/dtos/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  // POST /auth/register
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.usersService.register(registerUserDto);

    return this.authService.login(user);
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  // GET /auth/profile
  // This route is protected. You must include a valid JWT in the Authorization header
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@GetUser() user: UserPayloadDto) {
    return user;
  }
}

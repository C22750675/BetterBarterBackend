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
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterUserDto } from 'src/users/dtos/register-user.dto';
import { JwtAuthGuard } from './decorators/jwt-auth.guard';
import { UserPayloadDto } from './dto/user-payload.dto';
import { GetUser } from './decorators/get-user.decorator';
import { LoginUserDto } from 'src/users/dtos/login-user.dto';
import { UpdateProfileDto } from 'src/users/dtos/update-profile.dto';

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
  async getProfile(@GetUser() user: UserPayloadDto) {
    const fullUser = await this.usersService.findProfileById(user.id);

    if (!fullUser) {
      throw new UnauthorizedException('Profile not found.');
    }

    return fullUser;
  }

  // PATCH /auth/profile
  // This route is for updating the user's bio and profile picture URL
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @GetUser() user: UserPayloadDto, // Get the full UserPayloadDto object
    @Body() profile: UpdateProfileDto,
  ) {
    // Pass the 'id' property from the user object to the service
    const existingUser = await this.usersService.findProfileById(user.id);

    if (!existingUser) {
      throw new UnauthorizedException('Profile not found.');
    }

    // Update only the fields that are provided in the DTO
    if (profile.bio !== undefined) {
      existingUser.bio = profile.bio;
    }
    if (profile.profilePictureUrl !== undefined) {
      existingUser.profilePictureUrl = profile.profilePictureUrl;
    }

    // Save the updated user entity
    return this.usersService.updateUserProfile(existingUser);
  }
}

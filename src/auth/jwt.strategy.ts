import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { ValidatedUser } from './interfaces/validated-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    // Get the secret from the config service first
    const secret = configService.get<string>('JWT_SECRET');

    // A check to ensure the secret exists. If not, throw an error
    if (!secret) {
      throw new Error('JWT_SECRET is not set in the environment variables!');
    }

    // Pass the guaranteed-to-be-a-string secret to the super constructor
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // This method runs after the token is verified
  async validate(payload: {
    sub: string;
    username: string;
  }): Promise<ValidatedUser> {
    // Fetch the full user entity from the database
    const user = await this.usersService.findOneByUsername(payload.username);
    if (!user) {
      throw new UnauthorizedException();
    }

    // Strip the password hash before returning the user object
    // This ensures request.user contains full details (reputation, bio, etc.)
    const { passwordHash, ...result } = user;
    return result;
  }
}

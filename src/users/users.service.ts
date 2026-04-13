import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dtos/register-user.dto.js';
import { ValidatedUser } from '../auth/interfaces/validated-user.type.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Find a user by their username, explicitly selecting the passwordHash
  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash') // Select the hidden column
      .where('user.username = :username', { username })
      .getOne();
  }

  // Register a new user
  async register(registerUserDto: RegisterUserDto): Promise<User> {
    const existingUser = await this.findOneByUsername(registerUserDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      registerUserDto.password,
      saltRounds,
    );

    const newUser = this.usersRepository.create({
      ...registerUserDto,
      passwordHash: hashedPassword,
    });

    return this.usersRepository.save(newUser);
  }

  async findProfileById(id: string): Promise<ValidatedUser | null> {
    return this.usersRepository.findOne({
      where: { id },
      // Explicitly select all required profile fields EXCEPT the passwordHash
      select: [
        'id',
        'username',
        'bio',
        'profilePictureUrl',
        'reputationScore',
        'createdAt',
      ],
    });
  }

  async updateUserProfile(user: ValidatedUser): Promise<ValidatedUser> {
    return this.usersRepository.save(user);
  }
}

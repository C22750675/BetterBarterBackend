import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dtos/register-user.dto.js';
import { ValidatedUser } from '../auth/interfaces/validated-user.type.js';
import { ReputationService } from '../reputation/reputation.service.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(ReputationService)
    private readonly reputationService: ReputationService,
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

    // 1. Calculate the initial reputation score for a brand new account
    const initialReputationScore = this.reputationService.calculateScore({
      alpha: 2,
      beta: 1,
      tradeCount: 0,
      penaltyWeight: 0,
      isEmailVerified: false,
      isPhoneVerified: false,
    });

    // 2. Create the user entity with the calculated score
    const newUser = this.usersRepository.create({
      ...registerUserDto,
      passwordHash: hashedPassword,
      reputationScore: initialReputationScore,
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

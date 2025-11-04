import { User } from 'src/users/entities/user.entity';

export type ValidatedUser = Omit<User, 'passwordHash'>;

import { User } from '../../users/entities/user.entity.js';

export type ValidatedUser = Omit<User, 'passwordHash'>;

import type { User } from '../../db/schema/index.js';
import { ConflictError } from '../../error/index.js';
import { logger } from '../../logger/index.js';
import { hashPassword } from '../../utils/password.js';
import { authRepository } from './auth.repository.js';
import type { RegisterInput } from './auth.schema.js';

export const authService = {
  async registerUser(input: RegisterInput): Promise<User> {
    const { name, email, username, password } = input;

    // 1. Conflict check
    const existingUser = await authRepository.findUserByEmailOrUsername(email, username);
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('Email is already registered', 'EMAIL_ALREADY_EXISTS');
      }
      throw new ConflictError('Username is already taken', 'USERNAME_ALREADY_EXISTS');
    }

    // 2. Hash password with memory-hard Argon2id
    const passwordHash = await hashPassword(password);

    try {
      // 3. Persist record in repository
      const createdUser = await authRepository.createUser({
        name,
        email,
        username,
        passwordHash,
      });

      logger.info('User registered successfully', {
        userId: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
      });

      return createdUser;
    } catch (err: unknown) {
      // 4. Defensive catch for concurrent race conditions
      const dbErr = err as {
        code?: string;
        cause?: { code?: string; constraint?: string; detail?: string };
      };
      const code = dbErr.code || dbErr.cause?.code;
      const constraint = dbErr.cause?.constraint;

      if (code === '23505') {
        if (constraint === 'users_email_unique') {
          throw new ConflictError('Email is already registered', 'EMAIL_ALREADY_EXISTS');
        }
        if (constraint === 'users_username_unique') {
          throw new ConflictError('Username is already taken', 'USERNAME_ALREADY_EXISTS');
        }
        throw new ConflictError('User identifier already exists', 'USER_ALREADY_EXISTS');
      }
      throw err;
    }
  },
};

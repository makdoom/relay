import { v7 as uuidv7 } from 'uuid';
import { config } from '../../config/index.js';
import type { User } from '../../db/schema/index.js';
import { ConflictError, UnauthorizedError } from '../../error/index.js';
import { logger } from '../../logger/index.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generateRefreshToken, hashToken, signAccessToken } from '../../utils/token.js';
import { authRepository } from './auth.repository.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

export const authService = {
  /**
   * Registers a new user account:
   * 1. Checks for duplicate email or username
   * 2. Hashes the plaintext password with Argon2id
   * 3. Persists the user record via the repository
   */
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

  /**
   * Authenticates user with credentials and issues tokens:
   * 1. Looks up account by email or username
   * 2. Verifies password using constant-time comparison
   * 3. Creates a new token family and single-use refresh token in PostgreSQL
   * 4. Signs a short-lived access token
   */
  async loginUser(
    input: LoginInput
  ): Promise<{ user: User; accessToken: string; rawRefreshToken: string }> {
    const { identifier, password } = input;

    // Find user by email or password
    const user = await authRepository.findUserByEmailOrUsername(identifier, identifier);

    // Dummy Argon2id hash to prevent timing attacks / account enumeration
    const dummyHash =
      '$argon2id$v=19$m=65536,p=4,t=3$zxbJUKQu+hj4tPu/ImBVbw$KeLuhJryzpEIwb+mq7yoy2ncAA/CdPRXpmgB29WTbzY';

    const isPasswordValid = await verifyPassword(user ? user.passwordHash : dummyHash, password);
    if (!user || !isPasswordValid) {
      throw new UnauthorizedError('Invalid email/username or password', 'INVALID_CREDENTIALS');
    }

    // Issue new token family and refresh token
    const familyId = uuidv7();
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(
      Date.now() + config.jwt.refreshTokenExpirationDays * 24 * 60 * 60 * 1000
    );

    await authRepository.createRefreshToken({ userId: user.id, familyId, tokenHash, expiresAt });

    // Issue access token
    const accessToken = signAccessToken({ sub: user.id });

    logger.info('User logged in successfully', { userId: user.id, familyId });

    return { user, accessToken, rawRefreshToken };
  },

  /**
   * Rotates a refresh token:
   * 1. Hashes incoming raw token and looks up record
   * 2. If token is revoked, detects reuse attack and revokes entire family
   * 3. If valid, revokes old token and issues replacement in same family
   */
  async refreshTokens(
    rawRefreshToken: string
  ): Promise<{ user: User; accessToken: string; newRawRefreshToken: string }> {
    if (!rawRefreshToken)
      throw new UnauthorizedError('Refresh token required', 'REFRESH_TOKEN_REQUIRED');

    // Hash and lookup
    const tokenHash = hashToken(rawRefreshToken);
    const tokenRecord = await authRepository.findRefreshTokenByHash(tokenHash);
    if (!tokenRecord) throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');

    // Reuse detection: Invalidate entire family if already revoked
    if (tokenRecord.isRevoked) {
      await authRepository.revokeTokenFamily(tokenRecord.familyId);
      logger.warn('Refresh token reuse detected. Family revoked.', {
        familyId: tokenRecord.familyId,
        userId: tokenRecord.userId,
      });
      throw new UnauthorizedError(
        'Refresh token reuse detected. Session terminated.',
        'TOKEN_REUSE_DETECTED'
      );
    }

    // Expiration check
    if (new Date() > tokenRecord.expiresAt) {
      await authRepository.revokeRefreshToken(tokenRecord.id);
      throw new UnauthorizedError('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED');
    }

    // Single-use rotation: Revoke current token
    await authRepository.revokeRefreshToken(tokenRecord.id);

    const user = await authRepository.findUserById(tokenRecord.userId);
    if (!user) throw new UnauthorizedError('User account not found', 'USER_NOT_FOUND');

    // Issue new refresh token within the same family
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRawRefreshToken);
    const expiresAt = new Date(
      Date.now() + config.jwt.refreshTokenExpirationDays * 24 * 60 * 60 * 1000
    );

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: tokenRecord.familyId,
      expiresAt,
    });

    const accessToken = signAccessToken({ sub: user.id });

    return {
      user,
      accessToken,
      newRawRefreshToken,
    };
  },

  // Logout user by revoking the presented refresh token.
  async logoutUser(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    const tokenHash = hashToken(rawRefreshToken);
    const tokenRecord = await authRepository.findRefreshTokenByHash(tokenHash);

    if (tokenRecord && !tokenRecord.isRevoked) {
      await authRepository.revokeRefreshToken(tokenRecord.id);
      logger.info('User logged out successfully', {
        userId: tokenRecord.userId,
        familyId: tokenRecord.familyId,
      });
    }
  },

  /**
   * Retrieves the currently authenticated user's record.
   */
  async getCurrentUser(userId: string): Promise<User> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError('User account not found', 'USER_NOT_FOUND');
    }
    return user;
  },
};

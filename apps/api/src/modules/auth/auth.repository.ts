import { eq, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  type NewRefreshToken,
  type NewUser,
  type RefreshToken,
  refreshTokens,
  type User,
  users,
} from '../../db/schema/index.js';

export const authRepository = {
  // Find a user by their unique primary key ID.
  async findUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  },

  // Find a user by their unique email.
  async findUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  },

  // Find a user by their unique username.
  async findUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  },

  // Find a user matching either email or username (used for collision detection on registration).
  async findUserByEmailOrUsername(email: string, username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);
    return user;
  },

  // Insert a new user into PostgreSQL.
  async createUser(data: NewUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(data).returning();
    return createdUser;
  },

  // Create and persist a new refresh token record.
  async createRefreshToken(data: NewRefreshToken): Promise<RefreshToken> {
    const [createdToken] = await db.insert(refreshTokens).values(data).returning();
    return createdToken;
  },

  // Find a refresh token by its SHA-256 hash.
  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined> {
    const [token] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    return token;
  },

  // Mark a single refresh token as revoked.
  async revokeRefreshToken(id: string): Promise<void> {
    await db.update(refreshTokens).set({ isRevoked: true }).where(eq(refreshTokens.id, id));
  },

  // Revoke all tokens belonging to a token family (triggered on reuse detection).
  async revokeTokenFamily(familyId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.familyId, familyId));
  },
};

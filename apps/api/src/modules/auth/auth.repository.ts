import { eq, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { type NewUser, type User, users } from '../../db/schema/index.js';

export const authRepository = {
  /**
   * Find a user by their unique primary key ID.
   */
  async findUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  },

  /**
   * Find a user by their unique email.
   */
  async findUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  },

  /**
   * Find a user by their unique username.
   */
  async findUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  },

  /**
   * Find a user matching either email or username (used for collision detection on registration).
   */
  async findUserByEmailOrUsername(email: string, username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);
    return user;
  },

  /**
   * Insert a new user into PostgreSQL.
   */
  async createUser(data: NewUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(data).returning();
    return createdUser;
  },
};

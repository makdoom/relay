import { and, asc, eq, ilike, ne, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import type { SafeUserProfile } from './users.schema.js';

export const usersRepository = {
  /**
   * Search users by username or display name substring, excluding the requesting user.
   * Parameterized via Drizzle to prevent SQL injection.
   * Escapes SQL LIKE/ILIKE pattern wildcards (%, _, \) in the search term.
   */
  async searchUsers(params: {
    currentUserId: string;
    query: string;
    limit: number;
  }): Promise<SafeUserProfile[]> {
    const escapedQuery = params.query.replace(/[%_\\]/g, '\\$&');
    const pattern = `%${escapedQuery}%`;

    return db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
      })
      .from(users)
      .where(
        and(
          ne(users.id, params.currentUserId),
          or(ilike(users.username, pattern), ilike(users.name, pattern))
        )
      )
      .orderBy(asc(users.username))
      .limit(params.limit);
  },

  /**
   * Find a user by their unique primary key ID, returning only safe public profile fields.
   */
  async findSafeUserById(id: string): Promise<SafeUserProfile | undefined> {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  },
};

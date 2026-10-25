import { NotFoundError } from '../../error/index.js';
import { usersRepository } from './users.repository.js';
import type { SafeUserProfile } from './users.schema.js';

export const usersService = {
  /**
   * Search users by username or display name substring.
   * Excludes the requesting user from the results.
   */
  async searchUsers(params: {
    currentUserId: string;
    query: string;
    limit?: number;
  }): Promise<SafeUserProfile[]> {
    const trimmedQuery = params.query.trim();
    if (!trimmedQuery) return [];

    const limit = Math.min(Math.max(params.limit ?? 10, 1), 20);
    console.log(limit);

    return usersRepository.searchUsers({
      currentUserId: params.currentUserId,
      query: trimmedQuery,
      limit,
    });
  },

  /**
   * Look up a single user by primary key ID and return their safe public profile.
   * Throws NotFoundError if no user exists with the given ID.
   */
  async getUserById(id: string): Promise<SafeUserProfile> {
    const user = await usersRepository.findSafeUserById(id);
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }
    return user;
  },
};

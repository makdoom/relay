import type { SearchUsersParams, UserProfile } from '@/types/user';
import apiClient from './client';

type SearchUsersResponse = {
  users: UserProfile[];
};

// type GetUserResponse = {
//   user: UserProfile;
// };

/**
 * Search registered users by query term (matches username or display name).
 * Queries are scoped and exclude the authenticated user.
 */
export const searchUsers = async (params: SearchUsersParams): Promise<UserProfile[]> => {
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  const response = await apiClient.get<SearchUsersResponse>('/users/search', {
    params: {
      q: trimmed,
      limit: params.limit,
    },
  });

  return response.data.users;
};

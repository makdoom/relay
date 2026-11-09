export type UserProfile = {
  id: string;
  username: string;
  name: string;
};

export type SearchUsersParams = {
  query: string;
  limit?: number;
};

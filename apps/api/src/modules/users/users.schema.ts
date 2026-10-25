import z from 'zod';

export const searchUsersQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Search query cannot be empty')
    .max(50, 'Search query must be at most 50 characters'),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(20, 'Limit must be at most 20')
    .default(10),
});

export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;

export const userParamsSchema = z.object({
  id: z.uuid('Invalid user Id format'),
});

export type UserParams = z.infer<typeof userParamsSchema>;

export interface SafeUserProfile {
  id: string;
  name: string;
  username: string;
}

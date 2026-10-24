import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name cannot be empty')
    .max(128, 'Name must be at most 128 characters'),
  email: z
    .email('Invalid email address format')
    .max(255, 'Email must be at most 255 characters')
    .transform((val) => val.toLowerCase()),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  username: string;
  createdAt: string;
}

export function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  username: string;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
  };
}

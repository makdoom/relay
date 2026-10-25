import { z } from 'zod';
import type { SafeUserProfile } from '../users/users.schema.js';

export const createDirectConversationSchema = z.object({
  recipientId: z.uuid('Invalid recipient Id format'),
});

export type CreateDirectConversationInput = z.infer<typeof createDirectConversationSchema>;

export const listConversationsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit must be at most 50')
    .default(20),
});

export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;

export interface DirectConversationResponse {
  id: string;
  type: 'direct';
  createdAt: string;
  recipient: SafeUserProfile;
}

export interface DirectConversationItem {
  id: string;
  type: 'direct';
  recipient: SafeUserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface GroupConversationItem {
  id: string;
  type: 'group';
  title: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export type ConversationListItem = DirectConversationItem | GroupConversationItem;

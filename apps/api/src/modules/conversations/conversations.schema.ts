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

export const createGroupConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Group title is required')
    .max(100, 'Group title must be at most 100 characters'),
  memberIds: z.array(z.uuid('Invalid user Id in memberIds')).optional().default([]),
});

export type CreateGroupConversationInput = z.infer<typeof createGroupConversationSchema>;

export const addMemberSchema = z.object({
  userId: z.uuid('Invalid user Id format'),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateGroupSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Group title is required')
    .max(100, 'Group title must be at most 100 characters'),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const conversationIdParamSchema = z.object({
  id: z.uuid('Invalid conversation Id format'),
});

export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;

export const memberParamSchema = z.object({
  id: z.uuid('Invalid conversation Id format'),
  userId: z.uuid('Invalid user Id format'),
});

export type MemberParam = z.infer<typeof memberParamSchema>;

export interface GroupMemberItem {
  userId: string;
  role: string;
  joinedAt: string;
  leftAt: string | null;
  name?: string;
  username?: string;
}

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

export interface GroupConversationResponse {
  id: string;
  type: 'group';
  title: string | null;
  createdAt: string;
  updatedAt: string;
  members?: GroupMemberItem[];
}

export type ConversationListItem = DirectConversationItem | GroupConversationItem;

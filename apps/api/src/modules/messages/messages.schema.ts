import { z } from 'zod';
import type { Message } from '../../db/schema/index.js';

export const conversationIdParamSchema = z.object({
  conversationId: z.uuid('Invalid conversation Id format'),
});

export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message content is required')
    .max(4000, 'Message content cannot exceed 4000 characters'),
  idempotencyKey: z
    .string()
    .trim()
    .min(1, 'Idempotency key cannot be empty')
    .max(64, 'Idempotency key cannot exceed 64 characters')
    .optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  idempotencyKey: string | null;
  createdAt: string;
}

export interface SendMessageResult {
  message: MessageResponse;
  isDuplicate: boolean;
}

export const listMessagesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .default(20),
  cursor: z.uuid('Cursor must be a valid UUID').optional(),
});

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

export interface PaginatedMessagesResponse {
  messages: MessageResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const serializeMessage = (message: Message): MessageResponse => {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    idempotencyKey: message.idempotencyKey,
    createdAt: message.createdAt.toISOString(),
  };
};

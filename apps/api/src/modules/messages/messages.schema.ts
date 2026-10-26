import { z } from 'zod';

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

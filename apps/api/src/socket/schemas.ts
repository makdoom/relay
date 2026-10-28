import { z } from 'zod';
import type { SocketAck, SocketErrorPayload } from './types.js';

/**
 * Zod schema for validating the incoming 'message:send' socket event payload.
 * Mirrors the HTTP POST /api/v1/conversations/:conversationId/messages validation rules.
 */
export const socketSendMessageSchema = z.object({
  conversationId: z.uuid('Invalid conversation Id format'),
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

export type SocketSendMessageInput = z.infer<typeof socketSendMessageSchema>;

/**
 * Zod schema for validating conversation room operations ('conversation:join', 'conversation:leave').
 */
export const socketConversationRoomSchema = z.object({
  conversationId: z.uuid('Invalid conversation ID format'),
});

export type SocketConversationRoomInput = z.infer<typeof socketConversationRoomSchema>;

/**
 * Zod schema for validating ephemeral typing indicator events ('typing:start', 'typing:stop').
 */
export const socketTypingSchema = z.object({
  conversationId: z.uuid('Invalid conversation ID format'),
});

export type SocketTypingInput = z.infer<typeof socketTypingSchema>;

/**
 * Zod schema for validating read-state / watermark update event ('read:update').
 * Advances the participant's last_read_message_id watermark.
 */
export const socketReadUpdateSchema = z.object({
  conversationId: z.uuid('Invalid conversation ID format'),
  lastReadMessageId: z.uuid('Invalid message ID format'),
});

export type SocketReadUpdateInput = z.infer<typeof socketReadUpdateSchema>;

/**
 * Zod schema for validating history catch-up / sync event ('history:sync').
 * Allows reconnecting clients to retrieve messages committed since a cursor.
 */
export const socketHistorySyncSchema = z.object({
  conversationId: z.uuid('Invalid conversation ID format'),
  cursor: z.uuid('Cursor must be a valid UUID').optional(),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .optional(),
});

export type SocketHistorySyncInput = z.infer<typeof socketHistorySyncSchema>;


/**
 * Zod schema for validating on-demand presence query ('presence:get').
 * Allows clients to query current online/offline statuses for a batch of users.
 */
export const socketPresenceQuerySchema = z.object({
  userIds: z
    .array(z.string().uuid('Invalid user ID format in presence query'))
    .min(1, 'At least one user ID is required')
    .max(100, 'Cannot query more than 100 user IDs at once'),
});

export type SocketPresenceQueryInput = z.infer<typeof socketPresenceQuerySchema>;


/**
 * Formats a successful Socket.IO acknowledgement response.
 */
export const createSocketSuccessAck = <T>(data: T): SocketAck<T> => {
  return {
    success: true,
    data,
  };
};

/**
 * Formats an error Socket.IO acknowledgement response.
 */
export const createSocketErrorAck = (
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): SocketAck<never> => {
  const error: SocketErrorPayload = {
    code,
    message,
    statusCode,
  };

  if (details !== undefined) {
    error.details = details;
  }

  return {
    success: false,
    error,
  };
};

/**
 * Formats Zod validation errors into a standardized SocketErrorPayload.
 */
export const formatZodSocketError = (error: z.ZodError): SocketErrorPayload => {
  const issues = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

  return {
    code: 'VALIDATION_ERROR',
    message: 'Invalid event payload shape',
    statusCode: 400,
    details: issues,
  };
};

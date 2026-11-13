import { AppError, ForbiddenError, NotFoundError } from '../../error/index.js';
import { logger } from '../../logger/index.js';
import { conversationsRepository } from '../../modules/conversations/conversations.repository.js';
import {
  createSocketErrorAck,
  createSocketSuccessAck,
  formatZodSocketError,
  socketConversationRoomSchema,
} from '../schemas.js';
import type { AppSocket, AppSocketServer } from '../types.js';

/**
 * Standardizes the conversation room name.
 */
export function getConversationRoomName(conversationId: string): string {
  return `conversation:${conversationId}`;
}

/**
 * Registers conversation room subscription event handlers ('conversation:join', 'conversation:leave')
 * for an authenticated client socket.
 */
export function registerConversationHandlers(_io: AppSocketServer, socket: AppSocket): void {
  const currentUserId = socket.data.user.id;

  socket.on('conversation:join', async (rawPayload, ack) => {
    // 1. Validate payload structure with Zod
    const parsed = socketConversationRoomSchema.safeParse(rawPayload);
    if (!parsed.success) {
      if (typeof ack === 'function') {
        ack({
          success: false,
          error: formatZodSocketError(parsed.error),
        });
      }
      return;
    }

    const { conversationId } = parsed.data;

    try {
      // 2. Verify conversation existence
      const conversation = await conversationsRepository.findConversationById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');
      }

      // 3. Enforce membership authorization: user must be an active participant
      const member = await conversationsRepository.findMember(conversationId, currentUserId);
      if (!member) {
        throw new ForbiddenError('You are not a member of this conversation', 'NOT_A_MEMBER');
      }

      if (member.leftAt !== null) {
        throw new ForbiddenError(
          'You have left this conversation and cannot rejoin real-time updates',
          'CANNOT_JOIN_LEFT_CONVERSATION'
        );
      }

      // 4. Join the room on the socket
      const room = getConversationRoomName(conversationId);
      await socket.join(room);

      logger.info('Socket joined conversation room', {
        socketId: socket.id,
        userId: currentUserId,
        conversationId,
        room,
      });

      // 5. Acknowledge successful room subscription
      if (typeof ack === 'function') {
        ack(createSocketSuccessAck({ conversationId }));
      }
    } catch (err: unknown) {
      if (err instanceof AppError) {
        if (typeof ack === 'function') {
          ack(createSocketErrorAck(err.code, err.message, err.statusCode));
        }
        return;
      }

      logger.error('Unhandled error in socket conversation:join handler', {
        userId: currentUserId,
        conversationId,
        error: err instanceof Error ? err.message : String(err),
      });

      if (typeof ack === 'function') {
        ack(createSocketErrorAck('INTERNAL_SERVER_ERROR', 'Internal server error', 500));
      }
    }
  });

  socket.on('conversation:leave', async (rawPayload, ack) => {
    // 1. Validate payload structure with Zod
    const parsed = socketConversationRoomSchema.safeParse(rawPayload);
    if (!parsed.success) {
      if (typeof ack === 'function') {
        ack({
          success: false,
          error: formatZodSocketError(parsed.error),
        });
      }
      return;
    }

    const { conversationId } = parsed.data;
    const room = getConversationRoomName(conversationId);

    // 2. Leave the room on the socket
    await socket.leave(room);

    logger.info('Socket left conversation room', {
      socketId: socket.id,
      userId: currentUserId,
      conversationId,
      room,
    });

    // 3. Acknowledge leaving
    if (typeof ack === 'function') {
      ack(createSocketSuccessAck({ conversationId }));
    }
  });
}

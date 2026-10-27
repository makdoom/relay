import { AppError, ForbiddenError, NotFoundError } from "../../error/index.js";
import { logger } from "../../logger/index.js";
import { conversationsRepository } from "../../modules/conversations/conversations.repository.js";
import { createSocketErrorAck, createSocketSuccessAck, formatZodSocketError, socketConversationRoomSchema } from "../schemas.js";
import { AppSocket, AppSocketServer } from "../types.js";

// Standardizes the conversation room name.
export const getConversationRoomName = (conversationId: string): string => {
  return `conversation:${conversationId}`;
}

export const registerConversationHandler = (_io: AppSocketServer, socket: AppSocket): void => {
  const currentUserId = socket.data.user.id;

  socket.on('conversation:join', async (rawPayload, ack) => {
    // Validate payload structure with Zod
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
      // Verify conversation existence
      const conversation = await conversationsRepository.findConversationById(conversationId);
      if (!conversation) throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');

      // 3. Enforce membership authorization: user must be an active participant
      const member = await conversationsRepository.findMember(conversationId, currentUserId);
      if (!member) throw new ForbiddenError('You are not a member of this conversation', 'NOT_A_MEMBER');

      // Check if user has left the conversation
      if (member.leftAt !== null) {
        throw new ForbiddenError(
          'You have left this conversation and cannot rejoin real-time updates',
          'CANNOT_JOIN_LEFT_CONVERSATION'
        );
      }

      // Join the room on the socket
      const room = getConversationRoomName(conversationId);
      await socket.join(room)

      logger.info('Socket joined conversation room', {
        socketId: socket.id,
        userId: currentUserId,
        conversationId,
        room,
      });

      // Acknowledge successful room subscription
      if (typeof ack === 'function') {
        ack(createSocketSuccessAck({ conversationId }));
      }
    } catch (error) {
      if (error instanceof AppError) {
        if (typeof ack === 'function') {
          ack(createSocketErrorAck(error.code, error.message, error.statusCode));
        }
        return;
      }

      logger.error('Unhandled error in socket conversation:join handler', {
        userId: currentUserId,
        conversationId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (typeof ack === 'function') {
        ack(createSocketErrorAck('INTERNAL_SERVER_ERROR', 'Internal server error', 500));
      }
    }
  })

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
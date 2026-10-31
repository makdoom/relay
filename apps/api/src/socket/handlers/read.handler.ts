import { AppError } from '../../error/index.js';
import { logger } from '../../logger/index.js';
import { conversationsService } from '../../modules/conversations/conversations.service.js';
import {
  createSocketErrorAck,
  createSocketSuccessAck,
  formatZodSocketError,
  socketReadUpdateSchema,
} from '../schemas.js';
import type { AppSocket, AppSocketServer, SocketAck, SocketReadUpdateAckData } from '../types.js';
import { getConversationRoomName } from './conversations.handler.js';

/**
 * Registers read watermark event handlers ('read:update') for an authenticated client socket.
 * Handles Zod payload validation, conversation authorization, monotonic advancement persistence
 * in PostgreSQL, sender acknowledgement, and room read receipt broadcasting per ADR-005.
 */
export function registerReadHandlers(_io: AppSocketServer, socket: AppSocket): void {
  const currentUserId = socket.data.user.id;

  socket.on(
    'read:update',
    async (rawPayload, ack?: (response: SocketAck<SocketReadUpdateAckData>) => void) => {
      // 1. Validate payload structure with Zod
      const parsed = socketReadUpdateSchema.safeParse(rawPayload);
      if (!parsed.success) {
        if (typeof ack === 'function') {
          ack({
            success: false,
            error: formatZodSocketError(parsed.error),
          });
        }
        return;
      }

      const { conversationId, lastReadMessageId } = parsed.data;

      try {
        // 2. Persist monotonic watermark advancement in service layer
        const result = await conversationsService.updateReadWatermark({
          conversationId,
          userId: currentUserId,
          lastReadMessageId,
        });

        // 3. Return success acknowledgement callback to sender
        if (typeof ack === 'function') {
          ack(
            createSocketSuccessAck({
              conversationId,
              lastReadMessageId: result.lastReadMessageId,
            })
          );
        }

        // 4. Broadcast read receipt to other conversation members if watermark advanced
        if (result.updated) {
          const room = getConversationRoomName(conversationId);
          socket.to(room).emit('read:update', {
            conversationId,
            userId: currentUserId,
            lastReadMessageId: result.lastReadMessageId,
            readAt: result.readAt,
          });

          logger.debug('Read receipt broadcast to room', {
            conversationId,
            userId: currentUserId,
            lastReadMessageId: result.lastReadMessageId,
            room,
          });
        }
      } catch (err: unknown) {
        if (typeof ack === 'function') {
          if (err instanceof AppError) {
            ack(createSocketErrorAck(err.code, err.message, err.statusCode));
          } else {
            logger.error('Unexpected error updating read state', {
              error: err instanceof Error ? err.message : String(err),
              conversationId,
              userId: currentUserId,
            });
            ack(
              createSocketErrorAck(
                'INTERNAL_SERVER_ERROR',
                'An unexpected error occurred while updating read state',
                500
              )
            );
          }
        }
      }
    }
  );
}

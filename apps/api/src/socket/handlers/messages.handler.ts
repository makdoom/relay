import { v7 as uuidv7 } from 'uuid';
import { AppError } from '../../error/index.js';
import { logger } from '../../logger/index.js';
import { socketMessageRateLimiter } from '../../middleware/rateLimiter.js';
import type { PaginatedMessagesResponse } from '../../modules/messages/messages.schema.js';
import { messagesService } from '../../modules/messages/messages.service.js';
import { runWithContext } from '../../observability/context.js';
import {
  createSocketErrorAck,
  createSocketSuccessAck,
  formatZodSocketError,
  socketHistorySyncSchema,
  socketSendMessageSchema,
} from '../schemas.js';
import type { AppSocket, AppSocketServer, SocketMessageAckData } from '../types.js';
import { getConversationRoomName } from './conversations.handler.js';

/**
 * Registers message-related Socket.IO event handlers for an authenticated client socket.
 */
export function registerMessageHandlers(_io: AppSocketServer, socket: AppSocket): void {
  socket.on('message:send', async (rawPayload, ack) => {
    const requestId = uuidv7();
    const currentUserId = socket.data.user.id;

    await runWithContext({ requestId, userId: currentUserId }, async () => {
      // 1. Boundary payload validation with Zod
      const parsed = socketSendMessageSchema.safeParse(rawPayload);
      if (!parsed.success) {
        if (typeof ack === 'function') {
          const zodErr = formatZodSocketError(parsed.error);
          ack({
            success: false,
            error: {
              ...zodErr,
              requestId,
            },
          });
        }
        return;
      }

      const { conversationId, content, idempotencyKey } = parsed.data;

      // 2. Message rate limiting (Milestone 8.2)
      const rateLimitResult = socketMessageRateLimiter.check(currentUserId);
      if (!rateLimitResult.allowed) {
        if (typeof ack === 'function') {
          ack(
            createSocketErrorAck(
              'MESSAGE_RATE_LIMIT_EXCEEDED',
              'Message rate limit exceeded. Please slow down.',
              429,
              undefined,
              requestId
            )
          );
        }
        return;
      }

      try {
        // 3. Delegate to durable messaging service (authorization, ACID commit, idempotency)
        const result = await messagesService.sendMessage({
          conversationId,
          currentUserId,
          content,
          idempotencyKey,
        });

        // 3. Real-time delivery: broadcast to online recipients in the conversation room
        // Duplicate retries (idempotency hits) are not re-broadcasted to avoid noise
        if (!result.isDuplicate) {
          socket.to(getConversationRoomName(conversationId)).emit('message:new', {
            message: result.message,
          });
        }

        // 4. Return persistence acknowledgement to sender via callback
        if (typeof ack === 'function') {
          ack(createSocketSuccessAck<SocketMessageAckData>(result));
        }
      } catch (err: unknown) {
        if (err instanceof AppError) {
          logger.warn('Socket operational error in message:send handler', {
            requestId,
            userId: currentUserId,
            conversationId,
            code: err.code,
            message: err.message,
          });

          if (typeof ack === 'function') {
            ack(createSocketErrorAck(err.code, err.message, err.statusCode, undefined, requestId));
          }
          return;
        }

        logger.error('Unhandled error in socket message:send handler', {
          requestId,
          userId: currentUserId,
          conversationId,
          error: err instanceof Error ? err.message : String(err),
        });

        if (typeof ack === 'function') {
          ack(
            createSocketErrorAck(
              'INTERNAL_SERVER_ERROR',
              'Internal server error',
              500,
              undefined,
              requestId
            )
          );
        }
      }
    });
  });

  socket.on('history:sync', async (rawPayload, ack) => {
    const requestId = uuidv7();
    const currentUserId = socket.data.user.id;

    await runWithContext({ requestId, userId: currentUserId }, async () => {
      // 1. Boundary payload validation with Zod
      const parsed = socketHistorySyncSchema.safeParse(rawPayload);
      if (!parsed.success) {
        if (typeof ack === 'function') {
          const zodErr = formatZodSocketError(parsed.error);
          ack({
            success: false,
            error: {
              ...zodErr,
              requestId,
            },
          });
        }
        return;
      }

      const { conversationId, cursor, limit } = parsed.data;

      try {
        // 2. Delegate to messagesService to sync missed messages committed after cursor
        const result = await messagesService.syncMessagesAfterCursor({
          conversationId,
          currentUserId,
          cursor,
          limit,
        });

        // 3. Return missed messages to client via callback
        if (typeof ack === 'function') {
          ack(createSocketSuccessAck<PaginatedMessagesResponse>(result));
        }
      } catch (err: unknown) {
        if (err instanceof AppError) {
          logger.warn('Socket operational error in history:sync handler', {
            requestId,
            userId: currentUserId,
            conversationId,
            code: err.code,
            message: err.message,
          });

          if (typeof ack === 'function') {
            ack(createSocketErrorAck(err.code, err.message, err.statusCode, undefined, requestId));
          }
          return;
        }

        logger.error('Unhandled error in socket history:sync handler', {
          requestId,
          userId: currentUserId,
          conversationId,
          error: err instanceof Error ? err.message : String(err),
        });

        if (typeof ack === 'function') {
          ack(
            createSocketErrorAck(
              'INTERNAL_SERVER_ERROR',
              'Internal server error',
              500,
              undefined,
              requestId
            )
          );
        }
      }
    });
  });
}

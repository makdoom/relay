import { AppError } from "../../error/index.js";
import { logger } from "../../logger/index.js";
import { PaginatedMessagesResponse } from "../../modules/messages/messages.schema.js";
import { messagesService } from "../../modules/messages/messages.service.js";
import { createSocketErrorAck, createSocketSuccessAck, formatZodSocketError, socketHistorySyncSchema, socketSendMessageSchema } from "../schemas.js";
import { AppSocket, AppSocketServer, SocketMessageAckData } from "../types.js";
import { getConversationRoomName } from "./conversations.handler.js";

// Registers message-related Socket.IO event handlers for an authenticated client socket.
export const registerMessageHandler = (_io: AppSocketServer, socket: AppSocket) => {
  socket.on('message:send', async (rawPaload, ack) => {
    
    // Validation with Zod
    const parsed = socketSendMessageSchema.safeParse(rawPaload)
    if(!parsed.success) {
      if (typeof ack === 'function') {
        ack({
          success: false,
          error: formatZodSocketError(parsed.error),
        });
      }
      return;
    }

    const {conversationId, content, idempotencyKey } = parsed.data
    const currentUserId = socket.data.user.id;

    try {
      // Delegate to durable messaging service (authorization, ACID commit, idempotency)
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
      // Return persistence acknowledgement to sender via callback
      if (typeof ack === 'function') {
        ack(createSocketSuccessAck<SocketMessageAckData>(result));
      }

      
    } catch (error: unknown) {
      if (error instanceof AppError) {
        if (typeof ack === 'function') {
          ack(createSocketErrorAck(error.code, error.message, error.statusCode));
        }
        return;
      }

      logger.error('Unhandled error in socket message:send handler', {
        userId: currentUserId,
        conversationId,
        error: error instanceof Error ? error.message : String(error),
      })
      
      if (typeof ack === 'function') {
        ack(createSocketErrorAck('INTERNAL_SERVER_ERROR', 'Internal server error', 500));
      }
    }
  })

  socket.on('history:sync', async (rawPayload, ack) => {
    // 1. Boundary payload validation with Zod
    const parsed = socketHistorySyncSchema.safeParse(rawPayload);
    if (!parsed.success) {
      if (typeof ack === 'function') {
        ack({
          success: false,
          error: formatZodSocketError(parsed.error),
        });
      }
      return;
    }

    const { conversationId, cursor, limit } = parsed.data;
    const currentUserId = socket.data.user.id;

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
        if (typeof ack === 'function') {
          ack(createSocketErrorAck(err.code, err.message, err.statusCode));
        }
        return;
      }

      logger.error('Unhandled error in socket history:sync handler', {
        userId: currentUserId,
        conversationId,
        error: err instanceof Error ? err.message : String(err),
      });

      if (typeof ack === 'function') {
        ack(createSocketErrorAck('INTERNAL_SERVER_ERROR', 'Internal server error', 500));
      }
    }
  });
}
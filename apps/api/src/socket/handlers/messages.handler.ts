import { AppError } from "../../error/index.js";
import { logger } from "../../logger/index.js";
import { messagesService } from "../../modules/messages/messages.service.js";
import { createSocketErrorAck, createSocketSuccessAck, formatZodSocketError, socketSendMessageSchema } from "../schemas.js";
import { AppSocket, AppSocketServer, SocketMessageAckData } from "../types.js";

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
}
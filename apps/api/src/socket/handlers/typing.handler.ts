import { AppError } from '../../error/index.js';
import { logger } from '../../logger/index.js';
import { conversationsRepository } from '../../modules/conversations/conversations.repository.js';
import { type SocketTypingInput, socketTypingSchema } from '../schemas.js';
import type { AppSocket, AppSocketServer } from '../types.js';
import { getConversationRoomName } from './conversations.handler.js';

export const DEFAULT_TYPING_TIMEOUT_MS = 3000;

/**
 * In-memory map of active typing auto-expiry timers.
 * Key format: `${conversationId}:${userId}`
 */
const activeTypingTimers = new Map<string, NodeJS.Timeout>();

/**
 * Clears all active typing timers.
 * Useful for test suite isolation and graceful server shutdowns.
 */
export const clearAllTypingTimers = (): void => {
  for (const timer of activeTypingTimers.values()) {
    clearTimeout(timer);
  }
  activeTypingTimers.clear();
};

/**
 * Returns the active timer count (useful for test assertions).
 */
export const getActiveTypingTimersCount = (): number => {
  return activeTypingTimers.size;
};

export interface RegisterTypingHandlersOptions {
  timeoutMs?: number;
}

/**
 * Registers ephemeral typing indicator event handlers ('typing:start', 'typing:stop')
 * for an authenticated client socket.
 *
 * 1. Validates payload format with Zod (socketTypingSchema).
 * 2. Enforces active conversation membership authorization.
 * 3. Broadcasts 'typing:update' to the conversation room excluding the sender (socket.to).
 * 4. Schedules an in-memory auto-expiry timer (3s) to prevent stuck typing indicators.
 * 5. Cleans up timers and emits 'isTyping: false' upon socket disconnection.
 */
export const registerTypingHandlers = (
  io: AppSocketServer,
  socket: AppSocket,
  options: RegisterTypingHandlersOptions = {}
): void => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TYPING_TIMEOUT_MS;
  const currentUserId = socket.data.user.id;

  // Track conversation IDs where this specific socket instance has triggered active typing
  const socketTypingConvs = new Set<string>();

  /**
   * Helper to verify if the user is authorized to interact with the conversation.
   * Checks room presence first, falling back to database membership verification.
   */
  const isAuthorized = async (conversationId: string, room: string): Promise<boolean> => {
    if (socket.rooms.has(room)) {
      return true;
    }

    const conversation = await conversationsRepository.findConversationById(conversationId);
    if (!conversation) {
      return false;
    }

    const member = await conversationsRepository.findMember(conversationId, currentUserId);
    if (!member || member.leftAt !== null) {
      return false;
    }

    return true;
  };

  // Handle typing:start
  socket.on('typing:start', async (rawPayload: SocketTypingInput) => {
    // 1. Validate payload structure
    const parsed = socketTypingSchema.safeParse(rawPayload);
    if (!parsed.success) {
      logger.warn('Invalid socket typing:start payload received', {
        userId: currentUserId,
        error: parsed.error.issues,
      });
      return;
    }

    const { conversationId } = parsed.data;
    const room = getConversationRoomName(conversationId);
    const key = `${conversationId}:${currentUserId}`;

    try {
      // 2. Authorize sender
      const authorized = await isAuthorized(conversationId, room);
      if (!authorized) {
        logger.warn('Unauthorized socket typing:start attempt', {
          userId: currentUserId,
          conversationId,
        });
        return;
      }

      const isAlreadyTyping = activeTypingTimers.has(key);

      if (isAlreadyTyping) {
        // Reset existing timer (debounce consecutive keystrokes)
        const existingTimer = activeTypingTimers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
      } else {
        // Broadcast typing:update (isTyping: true) to room excluding sender
        socket.to(room).emit('typing:update', {
          conversationId,
          userId: currentUserId,
          isTyping: true,
        });

        logger.debug('Typing started', {
          userId: currentUserId,
          conversationId,
          socketId: socket.id,
        });
      }

      socketTypingConvs.add(conversationId);

      // 3. Schedule auto-expiry timer
      const timer = setTimeout(() => {
        activeTypingTimers.delete(key);
        socketTypingConvs.delete(conversationId);

        // Broadcast expiry to all members in the room
        io.to(room).emit('typing:update', {
          conversationId,
          userId: currentUserId,
          isTyping: false,
        });

        logger.debug('Typing indicator auto-expired', {
          userId: currentUserId,
          conversationId,
        });
      }, timeoutMs);

      // Do not block Node.js event loop from exiting if timer is pending
      if (typeof timer.unref === 'function') {
        timer.unref();
      }

      activeTypingTimers.set(key, timer);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        logger.warn('Domain error in socket typing:start handler', {
          userId: currentUserId,
          conversationId,
          code: err.code,
        });
        return;
      }

      logger.error('Unhandled error in socket typing:start handler', {
        userId: currentUserId,
        conversationId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Handle typing:stop
  socket.on('typing:stop', async (rawPayload: SocketTypingInput) => {
    // 1. Validate payload structure
    const parsed = socketTypingSchema.safeParse(rawPayload);
    if (!parsed.success) {
      logger.warn('Invalid socket typing:stop payload received', {
        userId: currentUserId,
        error: parsed.error.issues,
      });
      return;
    }

    const { conversationId } = parsed.data;
    const room = getConversationRoomName(conversationId);
    const key = `${conversationId}:${currentUserId}`;

    try {
      // 2. Authorize sender
      const authorized = await isAuthorized(conversationId, room);
      if (!authorized) {
        logger.warn('Unauthorized socket typing:stop attempt', {
          userId: currentUserId,
          conversationId,
        });
        return;
      }

      const timer = activeTypingTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        activeTypingTimers.delete(key);
      }

      socketTypingConvs.delete(conversationId);

      // Broadcast typing:update (isTyping: false) to room excluding sender
      socket.to(room).emit('typing:update', {
        conversationId,
        userId: currentUserId,
        isTyping: false,
      });

      logger.debug('Typing stopped', {
        userId: currentUserId,
        conversationId,
        socketId: socket.id,
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        logger.warn('Domain error in socket typing:stop handler', {
          userId: currentUserId,
          conversationId,
          code: err.code,
        });
        return;
      }

      logger.error('Unhandled error in socket typing:stop handler', {
        userId: currentUserId,
        conversationId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Handle socket disconnection: clean up active timers for this socket
  socket.on('disconnect', () => {
    if (socketTypingConvs.size === 0) {
      return;
    }

    for (const conversationId of socketTypingConvs) {
      const key = `${conversationId}:${currentUserId}`;
      const timer = activeTypingTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        activeTypingTimers.delete(key);
      }

      const room = getConversationRoomName(conversationId);
      // On disconnect, broadcast isTyping: false to room participants
      io.to(room).emit('typing:update', {
        conversationId,
        userId: currentUserId,
        isTyping: false,
      });

      logger.debug('Typing indicator cleared on socket disconnect', {
        userId: currentUserId,
        conversationId,
        socketId: socket.id,
      });
    }

    socketTypingConvs.clear();
  });
};

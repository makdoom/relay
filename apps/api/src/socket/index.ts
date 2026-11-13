import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { config } from '../config/index.js';
import { logger } from '../logger/index.js';
import { conversationsRepository } from '../modules/conversations/conversations.repository.js';
import { metrics } from '../observability/metrics.js';
import {
  getConversationRoomName,
  registerConversationHandlers,
} from './handlers/conversations.handler.js';
import { registerMessageHandlers } from './handlers/messages.handler.js';
import {
  defaultPresenceManager,
  getUserRoomName,
  type PresenceManager,
  registerPresenceHandlers,
} from './handlers/presence.handler.js';
import { registerReadHandlers } from './handlers/read.handler.js';
import { registerTypingHandlers } from './handlers/typing.handler.js';
import { socketAuthMiddleware } from './middleware/auth.js';
import type { AppSocketServer } from './types.js';

export {
  getConversationRoomName,
  registerConversationHandlers,
} from './handlers/conversations.handler.js';
export { registerMessageHandlers } from './handlers/messages.handler.js';
export {
  defaultPresenceManager,
  getUserRoomName,
  PresenceManager,
  registerPresenceHandlers,
} from './handlers/presence.handler.js';
export { registerReadHandlers } from './handlers/read.handler.js';
export {
  clearAllTypingTimers,
  DEFAULT_TYPING_TIMEOUT_MS,
  getActiveTypingTimersCount,
  registerTypingHandlers,
} from './handlers/typing.handler.js';
export { socketAuthMiddleware } from './middleware/auth.js';
export * from './schemas.js';
export * from './types.js';

export interface CreateSocketServerOptions {
  presenceManager?: PresenceManager;
}

/**
 * Creates and configures the Socket.IO server attached to an HTTP server.
 * Applies CORS, buffer limits, handshake authentication middleware, connection lifecycle logging,
 * and ephemeral presence tracking.
 */
export function createSocketServer(
  httpServer: HttpServer,
  options: CreateSocketServerOptions = {}
): AppSocketServer {
  const presence = options.presenceManager ?? defaultPresenceManager;

  const io: AppSocketServer = new Server(httpServer, {
    cors: {
      origin:
        config.env === 'development'
          ? (origin, callback) => {
              if (
                !origin ||
                origin === config.cors.origin ||
                /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
              ) {
                callback(null, true);
              } else {
                callback(new Error('CORS origin denied'), false);
              }
            }
          : config.cors.origin,
      credentials: true,
    },
    maxHttpBufferSize: 1e6, // 1 MB payload protection
  });

  // Enforce handshake authentication
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    logger.info('Socket client connected', {
      socketId: socket.id,
      userId,
    });

    // Automatically join user personal room for multi-device sync
    void socket.join(getUserRoomName(userId));

    // Automatically join all active conversations the user belongs to
    void conversationsRepository
      .listConversationsForUser(userId, 100)
      .then((convs) => {
        for (const c of convs) {
          void socket.join(getConversationRoomName(c.conversationId));
        }
      })
      .catch((err) => {
        logger.warn('Failed to auto-join user conversations on connect', {
          userId,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    // Track active connection and emit online broadcast if first socket
    metrics.incrementActiveSockets();
    const { isFirstConnection } = presence.addSocket(userId, socket.id);
    if (isFirstConnection) {
      io.emit('presence:update', { userId, status: 'online' });
    }

    // Register domain event handlers
    registerConversationHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerPresenceHandlers(io, socket, presence);
    registerReadHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      metrics.decrementActiveSockets();
      logger.info('Socket client disconnected', {
        socketId: socket.id,
        userId,
        reason,
      });

      // Untrack socket and emit offline broadcast if last connection closed
      const { isLastDisconnection } = presence.removeSocket(userId, socket.id);
      if (isLastDisconnection) {
        io.emit('presence:update', { userId, status: 'offline' });
      }
    });
  });

  return io;
}

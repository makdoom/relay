import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { config } from '../config/index.js';
import { logger } from '../logger/index.js';
import { registerConversationHandler } from './handlers/conversations.handler.js';
import { registerMessageHandler } from './handlers/messages.handler.js';
import { socketAuthMiddleware } from './middleware/auth.js';
import type { AppSocketServer } from './types.js';
import { registerTypingHandlers } from './handlers/typing.handler.js';

export * from './schemas.js';
export * from './types.js';

/**
 * Creates and configures the Socket.IO server attached to an HTTP server.
 * Applies CORS, buffer limits, handshake authentication middleware, and connection lifecycle logging.
 */

export const createSocketServer = (httpServer: HttpServer): AppSocketServer => {
  const io: AppSocketServer = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
    maxHttpBufferSize: 1e6, // 1 MB payload protection
  });

  // Enforce handshake authentication
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    logger.info('✅ Socket client connected', { socketId: socket.id, userId });

    // Register domain event hanlders
    registerMessageHandler(io, socket);
    registerConversationHandler(io, socket);
    registerTypingHandlers(io, socket)

    socket.on('disconnect', (reason) => {
      logger.info('❌ Socket client disconnected', { socketId: socket.id, userId, reason });
    });
  });
  return io;
};

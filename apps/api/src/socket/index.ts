import type { Server as HttpServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
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
export { createAdapter };

export interface CreateSocketServerOptions {
  presenceManager?: PresenceManager;
  redisUrl?: string;
  pubClient?: InstanceType<typeof Redis>;
  subClient?: InstanceType<typeof Redis>;
}

export interface RedisStatus {
  configured: boolean;
  connected: boolean;
  status: string;
}

/**
 * Returns current Redis connection and configuration health status for Socket.IO.
 */
export function getRedisStatus(io?: AppSocketServer): RedisStatus {
  const clients = (
    io as unknown as {
      redisClients?: {
        pubClient?: InstanceType<typeof Redis>;
        subClient?: InstanceType<typeof Redis>;
      };
    }
  )?.redisClients;

  if (!clients?.pubClient) {
    return {
      configured: false,
      connected: false,
      status: 'disabled',
    };
  }

  const status = clients.pubClient.status;
  return {
    configured: true,
    connected: status === 'ready',
    status,
  };
}

/**
 * Creates and configures the Socket.IO server attached to an HTTP server.
 * Applies CORS, buffer limits, handshake authentication middleware, connection lifecycle logging,
 * ephemeral presence tracking, and optional Redis Pub/Sub adapter for cross-instance fanout.
 */
export function createSocketServer(
  httpServer: HttpServer,
  options: CreateSocketServerOptions = {}
): AppSocketServer {
  const presence = options.presenceManager ?? defaultPresenceManager;

  // biome-ignore lint/suspicious/noImplicitAnyLet: <TODO>
  let adapter;
  let pubClient: InstanceType<typeof Redis> | undefined = options.pubClient;
  let subClient: InstanceType<typeof Redis> | undefined = options.subClient;
  let ownsRedisClients = false;

  const redisUrl = options.redisUrl ?? config.redis.url;

  const registerRedisEvents = (
    pub: InstanceType<typeof Redis>,
    sub: InstanceType<typeof Redis>
  ) => {
    pub.on('connect', () => {
      metrics.setRedisConnected(true);
      logger.info('Socket.IO Redis pubClient connected');
    });
    pub.on('ready', () => {
      metrics.setRedisConnected(true);
      logger.info('Socket.IO Redis pubClient ready');
    });
    pub.on('close', () => {
      metrics.setRedisConnected(false);
      logger.warn('Socket.IO Redis pubClient connection closed');
    });
    pub.on('error', (err: Error) => {
      metrics.setRedisConnected(false);
      logger.warn('Socket.IO Redis pubClient error', { error: err.message });
    });

    sub.on('close', () => {
      logger.warn('Socket.IO Redis subClient connection closed');
    });
    sub.on('error', (err: Error) => {
      logger.warn('Socket.IO Redis subClient error', { error: err.message });
    });

    if (pub.status === 'ready') {
      metrics.setRedisConnected(true);
    }
  };

  if (pubClient && subClient) {
    registerRedisEvents(pubClient, subClient);
    adapter = createAdapter(pubClient, subClient);
  } else if (redisUrl) {
    pubClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy(times: number) {
        return Math.min(times * 200, 2000);
      },
    });
    subClient = pubClient.duplicate();
    ownsRedisClients = true;

    registerRedisEvents(pubClient, subClient);
    adapter = createAdapter(pubClient, subClient);
    logger.info('Socket.IO configured with Redis Pub/Sub adapter', {
      redisTarget: redisUrl.replace(/\/\/[^@]*@/, '//***@'),
    });
  } else {
    logger.info('REDIS_URL not configured. Running with default in-memory Socket.IO adapter');
  }

  const io: AppSocketServer = new Server(httpServer, {
    ...(adapter ? { adapter } : {}),
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

  if (pubClient && subClient) {
    Object.assign(io, {
      redisClients: { pubClient, subClient },
    });
  }

  const originalClose = io.close.bind(io);
  io.close = (async (fn?: (err?: Error) => void): Promise<void> => {
    metrics.setRedisConnected(false);
    await new Promise<void>((resolve) => {
      originalClose((err) => {
        if (fn) fn(err);
        resolve();
      });
    });
    if (ownsRedisClients && pubClient && subClient) {
      const closeClient = async (client: InstanceType<typeof Redis>) => {
        if (client.status === 'ready') {
          try {
            await Promise.race([
              client.quit(),
              new Promise((r) => setTimeout(() => client.disconnect(), 1000)),
            ]);
          } catch {
            client.disconnect();
          }
        } else {
          client.disconnect();
        }
      };
      await Promise.allSettled([closeClient(pubClient), closeClient(subClient)]);
    }
  }) as typeof io.close;

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

import { logger } from '../../logger/index.js';
import {
  createSocketSuccessAck,
  formatZodSocketError,
  socketPresenceQuerySchema,
  type SocketPresenceQueryInput,
} from '../schemas.js';
import type {
  AppSocket,
  AppSocketServer,
  SocketAck,
  SocketPresenceQueryAckData,
} from '../types.js';

/**
 * Standardizes the user-private personal room name.
 * Used for targeted multi-device synchronization and private alerts.
 */
export function getUserRoomName(userId: string): string {
  return `user:${userId}`;
}

/**
 * In-memory presence manager maintaining active connection tracking per user.
 *
 * Implements Milestone 6.6 & ADR-008:
 * - Multi-device / multi-tab support using reference-counted socket sets:
 *   userSockets: Map<UserId, Set<SocketId>>
 * - Transitions to 'online' on first connection.
 * - Transitions to 'offline' ONLY when the last active socket disconnects.
 * - Ephemeral in-memory state: zero writes to PostgreSQL.
 */
export class PresenceManager {
  private readonly userSockets = new Map<string, Set<string>>();

  /**
   * Registers an active socket connection for a user.
   * Returns whether this is the user's first active connection (offline -> online transition).
   */
  public addSocket(userId: string, socketId: string): { isFirstConnection: boolean } {
    let sockets = this.userSockets.get(userId);
    const isFirstConnection = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set<string>();
      this.userSockets.set(userId, sockets);
    }

    sockets.add(socketId);

    logger.debug('Presence socket added', {
      userId,
      socketId,
      activeSocketsCount: sockets.size,
      isFirstConnection,
    });

    return { isFirstConnection };
  }

  /**
   * Removes a socket connection when closed.
   * Returns whether this was the user's last remaining connection (online -> offline transition).
   */
  public removeSocket(userId: string, socketId: string): { isLastDisconnection: boolean } {
    const sockets = this.userSockets.get(userId);
    if (!sockets) {
      return { isLastDisconnection: false };
    }

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      logger.debug('Presence socket removed (last connection)', {
        userId,
        socketId,
        isLastDisconnection: true,
      });
      return { isLastDisconnection: true };
    }

    logger.debug('Presence socket removed (other connections remaining)', {
      userId,
      socketId,
      activeSocketsCount: sockets.size,
      isLastDisconnection: false,
    });

    return { isLastDisconnection: false };
  }

  /**
   * Returns the current presence status of a single user.
   */
  public getUserStatus(userId: string): 'online' | 'offline' {
    const sockets = this.userSockets.get(userId);
    return sockets && sockets.size > 0 ? 'online' : 'offline';
  }

  /**
   * Returns current presence statuses for a batch of user IDs.
   */
  public getUserStatuses(userIds: string[]): Record<string, 'online' | 'offline'> {
    const result: Record<string, 'online' | 'offline'> = {};
    for (const id of userIds) {
      result[id] = this.getUserStatus(id);
    }
    return result;
  }

  /**
   * Returns the number of currently active sockets for a given user.
   */
  public getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size ?? 0;
  }

  /**
   * Returns the total count of distinct online users.
   */
  public getOnlineUserCount(): number {
    return this.userSockets.size;
  }

  /**
   * Clears all in-memory presence state.
   * Useful for test suite isolation and server shutdown.
   */
  public clearAllPresence(): void {
    this.userSockets.clear();
  }
}

/**
 * Singleton instance of PresenceManager for the application.
 */
export const defaultPresenceManager = new PresenceManager();

/**
 * Registers presence-related event handlers for an authenticated client socket.
 */
export function registerPresenceHandlers(
  _io: AppSocketServer,
  socket: AppSocket,
  presenceManager: PresenceManager = defaultPresenceManager
): void {
  // Handle on-demand presence query ('presence:get')
  socket.on(
    'presence:get',
    (
      rawPayload: SocketPresenceQueryInput,
      ack: (response: SocketAck<SocketPresenceQueryAckData>) => void
    ) => {
      // 1. Boundary payload validation with Zod
      const parsed = socketPresenceQuerySchema.safeParse(rawPayload);
      if (!parsed.success) {
        if (typeof ack === 'function') {
          ack({
            success: false,
            error: formatZodSocketError(parsed.error),
          });
        }
        return;
      }

      const { userIds } = parsed.data;
      const statuses = presenceManager.getUserStatuses(userIds);

      if (typeof ack === 'function') {
        ack(createSocketSuccessAck<SocketPresenceQueryAckData>({ statuses }));
      }
    }
  );
}
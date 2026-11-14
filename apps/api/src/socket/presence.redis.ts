import type { Redis } from 'ioredis';
import { logger } from '../logger/index.js';
import type { IPresenceManager } from './handlers/presence.handler.js';

export interface RedisPresenceManagerOptions {
  keyPrefix?: string;
  ttlSeconds?: number;
}

/**
 * Shared distributed presence manager backed by Redis.
 *
 * Implements Milestone 9.5:
 * - Multi-device / multi-instance reference counting using Redis Sets:
 *   Key format: `presence:user:${userId}` -> Set<socketId>
 * - Atomic transitions via Lua scripts:
 *   - Offline -> Online broadcast emitted only when set size goes 0 -> 1 cluster-wide.
 *   - Online -> Offline broadcast emitted only when set size goes 1 -> 0 cluster-wide.
 * - Key TTL (default 120s) with refresh prevents orphaned presence on abrupt instance crashes.
 * - Pipelined batch queries (`getUserStatuses`) in a single network round-trip.
 * - Enforces zero authorization responsibility: Redis stores ephemeral connection state only;
 *   authorization is strictly governed by PostgreSQL conversation membership.
 */
export class RedisPresenceManager implements IPresenceManager {
  private readonly redis: InstanceType<typeof Redis>;
  private readonly keyPrefix: string;
  private readonly ttlSeconds: number;

  constructor(
    redisClient: InstanceType<typeof Redis>,
    options: RedisPresenceManagerOptions = {}
  ) {
    this.redis = redisClient;
    this.keyPrefix = options.keyPrefix ?? 'presence:user:';
    this.ttlSeconds = options.ttlSeconds ?? 120; // 2-minute safety TTL
  }

  private getKey(userId: string): string {
    return `${this.keyPrefix}${userId}`;
  }

  /**
   * Registers an active socket connection for a user across the cluster.
   * Atomically adds socketId to the user's Redis Set and refreshes TTL.
   * Returns isFirstConnection: true only if cardinality was 0 before addition.
   */
  public async addSocket(userId: string, socketId: string): Promise<{ isFirstConnection: boolean }> {
    const key = this.getKey(userId);
    try {
      const luaScript = `
        local key = KEYS[1]
        local socketId = ARGV[1]
        local ttl = tonumber(ARGV[2])
        local prevCount = redis.call('SCARD', key)
        redis.call('SADD', key, socketId)
        redis.call('EXPIRE', key, ttl)
        return prevCount
      `;

      const prevCount = (await this.redis.eval(luaScript, 1, key, socketId, this.ttlSeconds)) as number;
      const isFirstConnection = prevCount === 0;

      logger.debug('Redis presence socket added', {
        userId,
        socketId,
        prevCount,
        isFirstConnection,
      });

      return { isFirstConnection };
    } catch (err) {
      logger.warn('Redis error in addSocket, falling back to false', {
        userId,
        socketId,
        error: err instanceof Error ? err.message : String(err),
      });
      return { isFirstConnection: false };
    }
  }

  /**
   * Removes a socket connection when closed across the cluster.
   * Atomically removes socketId and deletes key if remaining cardinality is 0.
   * Returns isLastDisconnection: true only if remaining cardinality is 0.
   */
  public async removeSocket(userId: string, socketId: string): Promise<{ isLastDisconnection: boolean }> {
    const key = this.getKey(userId);
    try {
      const luaScript = `
        local key = KEYS[1]
        local socketId = ARGV[1]
        redis.call('SREM', key, socketId)
        local remaining = redis.call('SCARD', key)
        if remaining == 0 then
          redis.call('DEL', key)
        end
        return remaining
      `;

      const remaining = (await this.redis.eval(luaScript, 1, key, socketId)) as number;
      const isLastDisconnection = remaining === 0;

      logger.debug('Redis presence socket removed', {
        userId,
        socketId,
        remaining,
        isLastDisconnection,
      });

      return { isLastDisconnection };
    } catch (err) {
      logger.warn('Redis error in removeSocket, falling back to false', {
        userId,
        socketId,
        error: err instanceof Error ? err.message : String(err),
      });
      return { isLastDisconnection: false };
    }
  }

  /**
   * Returns whether a single user is online across any instance in the cluster.
   */
  public async getUserStatus(userId: string): Promise<'online' | 'offline'> {
    const key = this.getKey(userId);
    try {
      const count = await this.redis.scard(key);
      return count > 0 ? 'online' : 'offline';
    } catch (err) {
      logger.warn('Redis error in getUserStatus', {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
      return 'offline';
    }
  }

  /**
   * Pipelined batch query for user presence across the cluster.
   * Executes in a single network round-trip.
   */
  public async getUserStatuses(userIds: string[]): Promise<Record<string, 'online' | 'offline'>> {
    if (userIds.length === 0) return {};

    const result: Record<string, 'online' | 'offline'> = {};
    try {
      const pipeline = this.redis.pipeline();
      for (const id of userIds) {
        pipeline.scard(this.getKey(id));
      }

      const responses = await pipeline.exec();
      if (!responses) {
        for (const id of userIds) result[id] = 'offline';
        return result;
      }

      for (let i = 0; i < userIds.length; i++) {
        const [err, count] = responses[i];
        if (err || typeof count !== 'number' || count <= 0) {
          result[userIds[i]] = 'offline';
        } else {
          result[userIds[i]] = 'online';
        }
      }
    } catch (err) {
      logger.warn('Redis error in getUserStatuses batch query', {
        error: err instanceof Error ? err.message : String(err),
      });
      for (const id of userIds) result[id] = 'offline';
    }

    return result;
  }

  /**
   * Returns active socket count for a user across all instances.
   */
  public async getUserSocketCount(userId: string): Promise<number> {
    try {
      return await this.redis.scard(this.getKey(userId));
    } catch {
      return 0;
    }
  }

  /**
   * Cleans all presence keys matching prefix (used in tests / teardown).
   */
  public async clearAllPresence(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      logger.warn('Redis error in clearAllPresence', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

import { and, asc, desc, eq, lt, lte, or, SQL, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { db } from '../../db/index.js';
import { conversations, type Message, messages } from '../../db/schema/index.js';

export interface CreateMessageParams {
  conversationId: string;
  senderId: string;
  content: string;
  idempotencyKey?: string | null;
}

export interface ListMessagesParams {
  conversationId: string;
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
  maxCreatedAt?: Date | null;
}


export interface ListMessagesAfterCursorParams {
  conversationId: string;
  limit: number;
  cursorId?: string;
  maxCreatedAt?: Date | null;
}

export const messagesRepository = {
  /**
   * Transactionally persists a message into PostgreSQL and updates the parent
   * conversation's updated_at timestamp in a single atomic ACID operation.
   */
  async createMessageTransactionally(params: CreateMessageParams): Promise<Message> {
    return await db.transaction(async (tx) => {
      // 1. Insert message
      const [createdMessage] = await tx
        .insert(messages)
        .values({
          id: uuidv7(),
          conversationId: params.conversationId,
          senderId: params.senderId,
          content: params.content,
          idempotencyKey: params.idempotencyKey ?? null,
        })
        .returning();

      // 2. Update parent conversation updated_at so it bubbles up to top of active chats
      await tx
        .update(conversations)
        .set({ updatedAt: sql`NOW()` })
        .where(eq(conversations.id, params.conversationId));

      return createdMessage;
    });
  },

  // Finds a message by primary key UUID.
  async findMessageById(id: string): Promise<Message | null> {
    const [found] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

    return found ?? null;
  },

  /**
   * Finds a message by senderId and idempotencyKey.
   */
  async findMessageBySenderAndIdempotencyKey(
    senderId: string,
    idempotencyKey: string
  ): Promise<Message | null> {
    const [found] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.senderId, senderId), eq(messages.idempotencyKey, idempotencyKey)))
      .limit(1);

    return found ?? null;
  },
  /**
   * Retrieves messages for a conversation ordered reverse-chronologically (created_at DESC, id DESC).
   * Supports keyset pagination via (cursorCreatedAt, cursorId) and bounded history via maxCreatedAt.
   * Fetches (limit + 1) rows to determine whether further pages exist.
   */
  async listMessagesByConversation(params: ListMessagesParams): Promise<Message[]> {
    const { conversationId, limit, cursorCreatedAt, cursorId, maxCreatedAt } = params;

    const conditions: SQL[] = [eq(messages.conversationId, conversationId)];

    if (maxCreatedAt) {
      conditions.push(lte(messages.createdAt, maxCreatedAt));
    }

    if (cursorCreatedAt && cursorId) {
      conditions.push(
        or(
          lt(messages.createdAt, cursorCreatedAt),
          and(eq(messages.createdAt, cursorCreatedAt), lt(messages.id, cursorId))
        )!
      );
    }

    return await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit + 1);
  },

  /**
   * Retrieves missed messages for a conversation committed after a given cursor,
   * ordered chronologically (created_at ASC, id ASC).
   * Used for reconnection catch-up and forward synchronization.
   * If no cursor is specified, returns the most recent messages.
   * Fetches (limit + 1) rows to determine whether further pages exist.
   */
  async listMessagesAfterCursor(params: ListMessagesAfterCursorParams): Promise<Message[]> {
    const { conversationId, limit, cursorId, maxCreatedAt } = params;

    const conditions: SQL[] = [eq(messages.conversationId, conversationId)];

    if (maxCreatedAt) {
      conditions.push(lte(messages.createdAt, maxCreatedAt));
    }

    if (cursorId) {
      conditions.push(
        sql`(${messages.createdAt}, ${messages.id}) > (SELECT ${messages.createdAt}, ${messages.id} FROM ${messages} WHERE ${messages.id} = ${cursorId})`
      );

      return await db
        .select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(asc(messages.createdAt), asc(messages.id))
        .limit(limit + 1);
    }

    // Without cursor, fetch the latest messages up to limit + 1, ordered chronologically
    const recent = await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit + 1);

    return recent.reverse();
  },
};

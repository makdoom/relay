import { eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { conversations, Message, messages } from "../../db/schema/index.js";
import { v7 as uuidv7 } from 'uuid';


export interface CreateMessageParams {
  conversationId: string;
  senderId: string;
  content: string;
  idempotencyKey?: string | null;
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
}
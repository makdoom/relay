import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { Conversation, conversationMembers, conversations, directConversations } from "../../db/schema/index.js";


export interface DirectConversationRecord {
  conversation: Conversation;
  isNew: boolean;
}


export const conversationsRepository = {
  /**
   * Find an existing direct conversation by its canonical user pair.
   */
  async findDirectConversation(
    userOneId: string,
    userTwoId: string
  ): Promise<Conversation | undefined> {
    const [result] = await db
      .select({
        conversation: conversations,
      })
      .from(directConversations)
      .innerJoin(conversations, eq(directConversations.conversationId, conversations.id))
      .where(
        and(
          eq(directConversations.userOneId, userOneId),
          eq(directConversations.userTwoId, userTwoId)
        )
      )
      .limit(1);

    return result?.conversation;
  },

  /**
   * Find a conversation by primary key ID.
   */
  async findConversationById(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);

    return conv;
  },

  /**
   * Atomically create a direct conversation and enroll both participants in a transaction.
   * If a concurrent transaction commits the exact same user pair first, the UNIQUE constraint
   * throws, rolling back the transaction without creating orphaned conversation rows.
   */
  async createDirectConversationAtomic(
    userOneId: string,
    userTwoId: string
  ): Promise<DirectConversationRecord> {
    try {
      return await db.transaction(async (tx) => {
        // 1. Double check under transaction
        const [existing] = await tx
          .select({
            conversation: conversations,
          })
          .from(directConversations)
          .innerJoin(conversations, eq(directConversations.conversationId, conversations.id))
          .where(
            and(
              eq(directConversations.userOneId, userOneId),
              eq(directConversations.userTwoId, userTwoId)
            )
          )
          .limit(1);

        if (existing) {
          return { conversation: existing.conversation, isNew: false };
        }

        // 2. Insert into conversations
        const [createdConv] = await tx
          .insert(conversations)
          .values({
            type: 'direct',
          })
          .returning();

        // 3. Insert into direct_conversations (protected by UNIQUE (user_one_id, user_two_id))
        await tx.insert(directConversations).values({
          conversationId: createdConv.id,
          userOneId,
          userTwoId,
        });

        // 4. Enroll both participants into conversation_members
        await tx.insert(conversationMembers).values([
          {
            conversationId: createdConv.id,
            userId: userOneId,
            role: 'member',
          },
          {
            conversationId: createdConv.id,
            userId: userTwoId,
            role: 'member',
          },
        ]);

        return { conversation: createdConv, isNew: true };
      });
    } catch (err: unknown) {
      // If unique constraint was violated due to a concurrent write race, query the winning conversation
      const dbErr = err as { code?: string; cause?: { code?: string } };
      const code = dbErr.code || dbErr.cause?.code;

      if (code === '23505') {
        const winningConv = await this.findDirectConversation(userOneId, userTwoId);
        if (winningConv) {
          return { conversation: winningConv, isNew: false };
        }
      }

      throw err;
    }
  },
}
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  type Conversation,
  type ConversationMember,
  conversationMembers,
  conversations,
  directConversations,
  users,
} from '../../db/schema/index.js';

export interface DirectConversationRecord {
  conversation: Conversation;
  isNew: boolean;
}

export interface RawConversationListRow {
  conversationId: string;
  type: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  recipientId: string | null;
  recipientName: string | null;
  recipientUsername: string | null;
}

export interface RawGroupMemberWithUser {
  userId: string;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
  name: string;
  username: string;
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

  /**
   * List active conversations for a given user with recipient or group metadata.
   * Scoped to conversation_members where left_at IS NULL.
   */
  async listConversationsForUser(userId: string, limit: number): Promise<RawConversationListRow[]> {
    const otherUserId = sql<string>`CASE WHEN ${directConversations.userOneId} = ${userId} THEN ${directConversations.userTwoId} ELSE ${directConversations.userOneId} END`;

    return db
      .select({
        conversationId: conversations.id,
        type: conversations.type,
        title: conversations.title,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        role: conversationMembers.role,
        recipientId: users.id,
        recipientName: users.name,
        recipientUsername: users.username,
      })
      .from(conversationMembers)
      .innerJoin(conversations, eq(conversationMembers.conversationId, conversations.id))
      .leftJoin(directConversations, eq(conversations.id, directConversations.conversationId))
      .leftJoin(users, eq(users.id, otherUserId))
      .where(and(eq(conversationMembers.userId, userId), isNull(conversationMembers.leftAt)))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit);
  },

  /**
   * Find a specific membership record by conversation ID and user ID.
   */
  async findMember(
    conversationId: string,
    userId: string
  ): Promise<ConversationMember | undefined> {
    const [member] = await db
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId)
        )
      )
      .limit(1);

    return member;
  },

  /**
   * List active or all members of a group with user profiles.
   */
  async listGroupMembers(conversationId: string): Promise<RawGroupMemberWithUser[]> {
    return db
      .select({
        userId: conversationMembers.userId,
        role: conversationMembers.role,
        joinedAt: conversationMembers.joinedAt,
        leftAt: conversationMembers.leftAt,
        name: users.name,
        username: users.username,
      })
      .from(conversationMembers)
      .innerJoin(users, eq(conversationMembers.userId, users.id))
      .where(eq(conversationMembers.conversationId, conversationId));
  },

  /**
   * Counts active admins and total active members in a conversation.
   * Useful for validating the sole admin departure guard.
   */
  async countActiveAdminsAndMembers(
    conversationId: string
  ): Promise<{ activeAdminsCount: number; totalActiveMembersCount: number }> {
    const [counts] = await db
      .select({
        activeAdminsCount: sql<number>`count(case when ${conversationMembers.role} = 'admin' then 1 end)::int`,
        totalActiveMembersCount: sql<number>`count(*)::int`,
      })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          isNull(conversationMembers.leftAt)
        )
      );

    return {
      activeAdminsCount: counts?.activeAdminsCount ?? 0,
      totalActiveMembersCount: counts?.totalActiveMembersCount ?? 0,
    };
  },

  /**
   * Atomically create a group conversation, assign the creator as 'admin', and enroll invitees as 'member'.
   */
  async createGroupConversationAtomic(
    title: string,
    creatorId: string,
    memberIds: string[]
  ): Promise<{ conversation: Conversation; members: ConversationMember[] }> {
    return db.transaction(async (tx) => {
      const [createdConv] = await tx
        .insert(conversations)
        .values({
          type: 'group',
          title,
        })
        .returning();

      const uniqueMemberIds = Array.from(new Set(memberIds)).filter((id) => id !== creatorId);

      const membersToInsert = [
        {
          conversationId: createdConv.id,
          userId: creatorId,
          role: 'admin',
        },
        ...uniqueMemberIds.map((userId) => ({
          conversationId: createdConv.id,
          userId,
          role: 'member',
        })),
      ];

      const insertedMembers = await tx
        .insert(conversationMembers)
        .values(membersToInsert)
        .returning();

      return {
        conversation: createdConv,
        members: insertedMembers,
      };
    });
  },

  /**
   * Add a member or reactivate a previously departed member.
   */
  async addOrReactivateMember(
    conversationId: string,
    userId: string
  ): Promise<{ member: ConversationMember; wasReactivated: boolean; alreadyActive: boolean }> {
    const existing = await this.findMember(conversationId, userId);

    if (existing) {
      if (existing.leftAt === null) {
        return { member: existing, wasReactivated: false, alreadyActive: true };
      }

      // Reactivate departed member
      const [reactivated] = await db
        .update(conversationMembers)
        .set({
          leftAt: null,
          joinedAt: sql`now()`,
          role: 'member',
        })
        .where(
          and(
            eq(conversationMembers.conversationId, conversationId),
            eq(conversationMembers.userId, userId)
          )
        )
        .returning();

      return { member: reactivated, wasReactivated: true, alreadyActive: false };
    }

    const [inserted] = await db
      .insert(conversationMembers)
      .values({
        conversationId,
        userId,
        role: 'member',
      })
      .returning();

    return { member: inserted, wasReactivated: false, alreadyActive: false };
  },

  /**
   * Soft-remove member by setting left_at to the given departure timestamp.
   */
  async setMemberLeftAt(
    conversationId: string,
    userId: string,
    leftAt: Date
  ): Promise<ConversationMember | undefined> {
    const [updated] = await db
      .update(conversationMembers)
      .set({
        leftAt,
      })
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
          isNull(conversationMembers.leftAt)
        )
      )
      .returning();

    return updated;
  },

  /**
   * Update group title.
   */
  async updateGroupTitle(conversationId: string, title: string): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({
        title,
        updatedAt: sql`now()`,
      })
      .where(and(eq(conversations.id, conversationId), eq(conversations.type, 'group')))
      .returning();

    return updated;
  },
};

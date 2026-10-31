import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../error/index.js';
import { messagesRepository } from '../messages/messages.repository.js';
import { usersService } from '../users/users.service.js';
import {
  assertCanLeaveConversation,
  assertCanManageMembers,
  assertCanUpdateGroup,
} from './conversations.permissions.js';
import { conversationsRepository } from './conversations.repository.js';
import type {
  ConversationListItem,
  DirectConversationResponse,
  GroupConversationResponse,
  GroupMemberItem,
} from './conversations.schema.js';

export interface GetOrCreateDirectResult {
  conversation: DirectConversationResponse;
  isNew: boolean;
}

export const conversationsService = {
  /**
   * Find an existing direct conversation or atomically create one.
   * Enforces self-chat prevention, recipient verification, and canonical ID ordering.
   */
  async getOrCreateDirectConversation(params: {
    currentUserId: string;
    recipientId: string;
  }): Promise<GetOrCreateDirectResult> {
    const { currentUserId, recipientId } = params;

    // 1. Prevent direct chats with self
    if (currentUserId === recipientId) {
      throw new BadRequestError(
        'Cannot start a direct conversation with yourself',
        'CANNOT_CHAT_WITH_SELF'
      );
    }

    // 2. Verify recipient exists and obtain safe public profile
    const recipient = await usersService.getUserById(recipientId);

    // 3. Establish canonical user ID ordering (lexicographical sort)
    const [userOneId, userTwoId] = [currentUserId, recipientId].sort();

    // 4. Check for existing direct conversation first
    const existing = await conversationsRepository.findDirectConversation(userOneId, userTwoId);
    if (existing) {
      return {
        conversation: {
          id: existing.id,
          type: 'direct',
          createdAt: existing.createdAt.toISOString(),
          recipient,
        },
        isNew: false,
      };
    }

    // 5. Atomically create conversation, direct mapping, and memberships
    const { conversation, isNew } = await conversationsRepository.createDirectConversationAtomic(
      userOneId,
      userTwoId
    );

    return {
      conversation: {
        id: conversation.id,
        type: 'direct',
        createdAt: conversation.createdAt.toISOString(),
        recipient,
      },
      isNew,
    };
  },

  /**
   * List conversations for the authenticated user with clean UI display metadata.
   * Clamps limit between 1 and 50 (default 20).
   */
  async listConversations(params: {
    currentUserId: string;
    limit?: number;
  }): Promise<ConversationListItem[]> {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);

    const rows = await conversationsRepository.listConversationsForUser(
      params.currentUserId,
      limit
    );

    return rows.map((row): ConversationListItem => {
      if (row.type === 'direct') {
        return {
          id: row.conversationId,
          type: 'direct',
          recipient: {
            id: row.recipientId!,
            name: row.recipientName!,
            username: row.recipientUsername!,
          },
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      }

      return {
        id: row.conversationId,
        type: 'group',
        title: row.title,
        role: row.role,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  },

  /**
   * Create a group conversation, automatically assigning currentUserId as admin
   * and enrolling any initial memberIds as members.
   */
  async createGroupConversation(params: {
    currentUserId: string;
    title: string;
    memberIds?: string[];
  }): Promise<GroupConversationResponse> {
    const { currentUserId, title, memberIds = [] } = params;

    // Verify all initial member IDs exist
    for (const memberId of memberIds) {
      if (memberId !== currentUserId) {
        await usersService.getUserById(memberId);
      }
    }

    const { conversation } = await conversationsRepository.createGroupConversationAtomic(
      title,
      currentUserId,
      memberIds
    );

    const membersWithUsers = await conversationsRepository.listGroupMembers(conversation.id);

    return {
      id: conversation.id,
      type: 'group',
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      members: membersWithUsers.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        leftAt: m.leftAt ? m.leftAt.toISOString() : null,
        name: m.name,
        username: m.username,
      })),
    };
  },

  /**
   * Add a new member to a group or reactivate a previously departed member.
   * Only active admins can manage members.
   */
  async addMemberToGroup(params: {
    conversationId: string;
    currentUserId: string;
    targetUserId: string;
  }): Promise<GroupMemberItem> {
    const { conversationId, currentUserId, targetUserId } = params;

    const conversation = await conversationsRepository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    const requesterMember = await conversationsRepository.findMember(conversationId, currentUserId);
    assertCanManageMembers(conversation, requesterMember);

    const targetUser = await usersService.getUserById(targetUserId);

    const { member, alreadyActive } = await conversationsRepository.addOrReactivateMember(
      conversationId,
      targetUserId
    );

    if (alreadyActive) {
      throw new ConflictError(
        'User is already a member of this conversation',
        'MEMBER_ALREADY_EXISTS'
      );
    }

    return {
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      leftAt: member.leftAt ? member.leftAt.toISOString() : null,
      name: targetUser.name,
      username: targetUser.username,
    };
  },

  /**
   * Remove a member from a group (soft removal setting left_at = NOW()).
   * Only active admins can remove members. Sole admin cannot be removed if other members remain.
   */
  async removeMemberFromGroup(params: {
    conversationId: string;
    currentUserId: string;
    targetUserId: string;
  }): Promise<{ message: string }> {
    const { conversationId, currentUserId, targetUserId } = params;

    const conversation = await conversationsRepository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    const requesterMember = await conversationsRepository.findMember(conversationId, currentUserId);
    assertCanManageMembers(conversation, requesterMember);

    const targetMember = await conversationsRepository.findMember(conversationId, targetUserId);
    if (!targetMember || targetMember.leftAt !== null) {
      throw new NotFoundError('Member not found or already departed', 'MEMBER_NOT_FOUND');
    }

    if (targetMember.role === 'admin') {
      const { activeAdminsCount, totalActiveMembersCount } =
        await conversationsRepository.countActiveAdminsAndMembers(conversationId);
      if (activeAdminsCount <= 1 && totalActiveMembersCount > 1) {
        throw new ForbiddenError(
          'Cannot remove the sole admin while other members remain',
          'SOLE_ADMIN_CANNOT_LEAVE'
        );
      }
    }

    await conversationsRepository.setMemberLeftAt(conversationId, targetUserId, new Date());

    return { message: 'Member removed successfully' };
  },

  /**
   * Voluntarily leave a group conversation (setting left_at = NOW()).
   * Cannot leave if sole admin and other active members remain.
   */
  async leaveGroup(params: {
    conversationId: string;
    currentUserId: string;
  }): Promise<{ message: string }> {
    const { conversationId, currentUserId } = params;

    const conversation = await conversationsRepository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    const requesterMember = await conversationsRepository.findMember(conversationId, currentUserId);
    const { activeAdminsCount, totalActiveMembersCount } =
      await conversationsRepository.countActiveAdminsAndMembers(conversationId);

    assertCanLeaveConversation(
      conversation,
      requesterMember,
      activeAdminsCount,
      totalActiveMembersCount
    );

    await conversationsRepository.setMemberLeftAt(conversationId, currentUserId, new Date());

    return { message: 'Left conversation successfully' };
  },

  /**
   * Update group title.
   * Only active admins can update group metadata.
   */
  async updateGroup(params: {
    conversationId: string;
    currentUserId: string;
    title: string;
  }): Promise<GroupConversationResponse> {
    const { conversationId, currentUserId, title } = params;

    const conversation = await conversationsRepository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    const requesterMember = await conversationsRepository.findMember(conversationId, currentUserId);
    assertCanUpdateGroup(conversation, requesterMember);

    const updated = await conversationsRepository.updateGroupTitle(conversationId, title);
    if (!updated) {
      throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    const membersWithUsers = await conversationsRepository.listGroupMembers(conversationId);

    return {
      id: updated.id,
      type: 'group',
      title: updated.title,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      members: membersWithUsers.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        leftAt: m.leftAt ? m.leftAt.toISOString() : null,
        name: m.name,
        username: m.username,
      })),
    };
  },


  /**
   * Advances a user's read watermark in a conversation monotonically.
   * - Verifies conversation exists.
   * - Verifies caller is an active member.
   * - Verifies message exists and belongs to the conversation.
   * - Enforces monotonic advancement in DB.
   */
  async updateReadWatermark(params: {
    conversationId: string;
    userId: string;
    lastReadMessageId: string;
  }): Promise<{
    updated: boolean;
    lastReadMessageId: string;
    readAt: string;
  }> {
    const { conversationId, userId, lastReadMessageId } = params;

    // 1. Verify conversation exists
    const conversation = await conversationsRepository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    // 2. Fetch membership
    const member = await conversationsRepository.findMember(conversationId, userId);
    if (!member) {
      throw new ForbiddenError('You are not a member of this conversation', 'NOT_A_MEMBER');
    }
    if (member.leftAt !== null) {
      throw new ForbiddenError(
        'Cannot update read state in a conversation you have left',
        'CANNOT_SEND_TO_LEFT_CONVERSATION'
      );
    }

    // 3. Verify message exists and belongs to this conversation
    const message = await messagesRepository.findMessageById(lastReadMessageId);
    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundError('Message not found in this conversation', 'MESSAGE_NOT_FOUND');
    }

    // 4. Fast path: if already at this watermark
    if (member.lastReadMessageId === lastReadMessageId) {
      return {
        updated: false,
        lastReadMessageId,
        readAt: member.lastReadAt ? member.lastReadAt.toISOString() : new Date().toISOString(),
      };
    }

    // 5. Attempt monotonic update in database
    const readAt = new Date();
    const updated = await conversationsRepository.advanceReadWatermark({
      conversationId,
      userId,
      messageId: lastReadMessageId,
      readAt,
    });

    if (updated) {
      return {
        updated: true,
        lastReadMessageId,
        readAt: updated.lastReadAt ? updated.lastReadAt.toISOString() : readAt.toISOString(),
      };
    }

    // If update returned nothing, target message was older than current watermark (rewind attempt)
    return {
      updated: false,
      lastReadMessageId: member.lastReadMessageId ?? lastReadMessageId,
      readAt: member.lastReadAt ? member.lastReadAt.toISOString() : readAt.toISOString(),
    };
  },

};

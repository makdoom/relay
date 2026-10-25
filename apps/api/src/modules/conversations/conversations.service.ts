import { conversationsRepository } from './conversations.repository.js';
import { usersService } from '../users/users.service.js';
import type { ConversationListItem, DirectConversationResponse } from './conversations.schema.js';
import { BadRequestError } from '../../error/index.js';

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
};

import { NotFoundError } from '../../error/index.js';
import {
  assertCanAccessMessageHistory,
  assertCanSendMessages,
} from '../conversations/conversations.permissions.js';
import { conversationsRepository } from '../conversations/conversations.repository.js';
import { messagesRepository } from './messages.repository.js';
import {
  type PaginatedMessagesResponse,
  type SendMessageResult,
  serializeMessage,
} from './messages.schema.js';

export const messagesService = {
  /**
   * Validates that the conversation exists and that the sender is an authorized active member.
   * Throws NotFoundError if conversation does not exist.
   * Throws ForbiddenError if the user is not a member or has departed.
   */
  async validateAndAuthorizeSend(params: {
    conversationId: string;
    currentUserId: string;
  }): Promise<{ conversationId: string; senderId: string }> {
    const { conversationId, currentUserId } = params;

    // Verify conversation exists
    const conversation = await conversationsRepository.findConversationById(conversationId);
    if (!conversation) throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');

    // Fetch membership record for authenticated user
    const member = await conversationsRepository.findMember(conversationId, currentUserId);

    // Enforce active membership check via permissions policy engine
    assertCanSendMessages(conversation, member);

    return {
      conversationId: conversation.id,
      senderId: currentUserId,
    };
  },

  // Validates sender authorization and transactionally persists the message to PostgreSQL.
  async sendMessage(params: {
    conversationId: string;
    currentUserId: string;
    content: string;
    idempotencyKey?: string;
  }): Promise<SendMessageResult> {
    const { conversationId, currentUserId, content, idempotencyKey } = params;

    // Validate conversation membership & authorization
    await this.validateAndAuthorizeSend({ conversationId, currentUserId });

    // Idempotency fast-path: check if message was already committed by this sender
    if (idempotencyKey) {
      const existing = await messagesRepository.findMessageBySenderAndIdempotencyKey(
        currentUserId,
        idempotencyKey
      );
      if (existing) {
        return {
          message: serializeMessage(existing),
          isDuplicate: true,
        };
      }
    }

    try {
      // Durably persist message and update conversation timestamp
      const persisted = await messagesRepository.createMessageTransactionally({
        conversationId,
        senderId: currentUserId,
        content,
        idempotencyKey,
      });

      return {
        message: serializeMessage(persisted),
        isDuplicate: false,
      };
    } catch (err) {
      const dbErr = err as { code?: string; cause?: { code?: string } };
      const code = dbErr.code || dbErr.cause?.code;

      // Handle race condition where an identical retry committed concurrently (unique violation)
      if (code === '23505' && idempotencyKey) {
        const existing = await messagesRepository.findMessageBySenderAndIdempotencyKey(
          currentUserId,
          idempotencyKey
        );
        if (existing) {
          return {
            message: serializeMessage(existing),
            isDuplicate: true,
          };
        }
      }
      throw err;
    }
  },

  /**
   * Retrieves message history for a conversation using keyset cursor pagination.
   * Re-checks conversation membership authorization on every request.
   * Enforces bounded historical access for departed members (created_at <= left_at).
   */
  async getMessageHistory(params: {
    conversationId: string;
    currentUserId: string;
    limit: number;
    cursor?: string;
  }): Promise<PaginatedMessagesResponse> {
    const { conversationId, currentUserId, limit, cursor } = params;

    // Verify conversation exists
    const conversation = await conversationsRepository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    // Fetch requester's membership record
    const member = await conversationsRepository.findMember(conversationId, currentUserId);

    // Enforce membership authorization check via permissions policy engine
    assertCanAccessMessageHistory(conversation, member);

    // Resolve cursor coordinates if provided
    let cursorCreatedAt: Date | undefined;
    let cursorId: string | undefined;

    if (cursor) {
      const cursorMessage = await messagesRepository.findMessageById(cursor);
      if (!cursorMessage || cursorMessage.conversationId !== conversationId) {
        throw new NotFoundError(
          'Cursor message not found in this conversation',
          'CURSOR_NOT_FOUND'
        );
      }

      // If departed member, cursor cannot bypass their departure bound
      if (member?.leftAt && cursorMessage.createdAt.getTime() > member.leftAt.getTime()) {
        throw new NotFoundError(
          'Cursor message not found in this conversation',
          'CURSOR_NOT_FOUND'
        );
      }

      cursorCreatedAt = cursorMessage.createdAt;
      cursorId = cursorMessage.id;
    }

    // Query messages with limit + 1
    const rawMessages = await messagesRepository.listMessagesByConversation({
      conversationId,
      limit,
      cursorCreatedAt,
      cursorId,
      maxCreatedAt: member?.leftAt ?? null,
    });

    const hasMore = rawMessages.length > limit;
    const pageMessages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
    const nextCursor = hasMore ? pageMessages[pageMessages.length - 1].id : null;

    return {
      messages: pageMessages.map(serializeMessage),
      nextCursor,
      hasMore,
    };
  },

  /**
   * Synchronizes missed messages for a conversation committed after a given cursor.
   * Designed for reconnection recovery and forward synchronization.
   * Returns messages in chronological order (created_at ASC, id ASC) with keyset nextCursor.
   */
  async syncMessagesAfterCursor(params: {
    conversationId: string;
    currentUserId: string;
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedMessagesResponse> {
    const { conversationId, currentUserId, cursor } = params;
    const limit = params.limit ?? 50;

    // 1. Verify conversation exists
    const conversation = await conversationsRepository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    // 2. Fetch requester's membership record
    const member = await conversationsRepository.findMember(conversationId, currentUserId);

    // 3. Enforce membership authorization check
    assertCanAccessMessageHistory(conversation, member);

    // 4. Resolve cursor coordinates if provided
    let cursorId: string | undefined;

    if (cursor) {
      const cursorMessage = await messagesRepository.findMessageById(cursor);
      if (!cursorMessage || cursorMessage.conversationId !== conversationId) {
        throw new NotFoundError(
          'Cursor message not found in this conversation',
          'CURSOR_NOT_FOUND'
        );
      }

      // If departed member, cursor cannot bypass their departure bound
      if (member?.leftAt && cursorMessage?.createdAt.getTime() > member?.leftAt.getTime()) {
        throw new NotFoundError(
          'Cursor message not found in this conversation',
          'CURSOR_NOT_FOUND'
        );
      }

      cursorId = cursorMessage.id;
    }

    // 5. Query messages committed after cursor
    const rawMessages = await messagesRepository.listMessagesAfterCursor({
      conversationId,
      limit,
      cursorId,
      maxCreatedAt: member?.leftAt ?? null,
    });

    const hasMore = rawMessages.length > limit;
    const pageMessages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
    const nextCursor = hasMore ? pageMessages[pageMessages.length - 1].id : null;

    return {
      messages: pageMessages.map(serializeMessage),
      nextCursor,
      hasMore,
    };
  },
};

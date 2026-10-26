import { NotFoundError } from '../../error/index.js';
import { assertCanSendMessages } from '../conversations/conversations.permissions.js';
import { conversationsRepository } from '../conversations/conversations.repository.js';
import { messagesRepository } from './messages.repository.js';
import { type SendMessageResult, serializeMessage } from './messages.schema.js';

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
};

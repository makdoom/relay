import { NotFoundError } from "../../error/index.js";
import { assertCanSendMessages } from "../conversations/conversations.permissions.js";
import { conversationsRepository } from "../conversations/conversations.repository.js";

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
}
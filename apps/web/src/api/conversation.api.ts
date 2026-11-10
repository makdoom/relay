import type {
  ConversationListItem,
  ConversationRecord,
  CreateDirectConversationInput,
  CreateGroupInput,
  DirectConversationResponse,
  GroupConversationResponse,
  ListConversationsResponse,
} from '@/types/conversation';
import apiClient from './client';

export async function listConversations(limit?: number): Promise<ConversationListItem[]> {
  const response = await apiClient.get<ListConversationsResponse>('/conversations', {
    params: limit ? { limit } : undefined,
  });
  return response.data.conversations;
}

/**
 * Open or create a direct conversation with a recipient user.
 * Idempotently resolves to the canonical conversation record (ADR-004).
 */
export async function createOrGetDirectConversation(
  input: CreateDirectConversationInput
): Promise<ConversationRecord> {
  const response = await apiClient.post<DirectConversationResponse>('/conversations/direct', {
    recipientId: input.recipientId,
  });
  return response.data.conversation;
}

/**
 * Create a new group conversation with creator as admin.
 */
export async function createGroupConversation(
  input: CreateGroupInput
): Promise<GroupConversationResponse['conversation']> {
  const response = await apiClient.post<GroupConversationResponse>('/conversations/group', input);
  return response.data.conversation;
}

import type { ConversationListItem, ListConversationsResponse } from '@/types/conversation';
import apiClient from './client';

export async function listConversations(limit?: number): Promise<ConversationListItem[]> {
  const response = await apiClient.get<ListConversationsResponse>('/conversations', {
    params: limit ? { limit } : undefined,
  });
  return response.data.conversations;
}

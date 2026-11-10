import type {
  ListMessagesParams,
  MessageResponse,
  PaginatedMessagesResponse,
  SendMessageInput,
} from '@/types/message';
import { apiClient } from './client';

interface SendMessageResponse {
  message: MessageResponse;
}

/**
 * Fetch paginated message history for a conversation using keyset cursor pagination.
 */
export async function fetchMessageHistory(
  conversationId: string,
  params?: ListMessagesParams
): Promise<PaginatedMessagesResponse> {
  const response = await apiClient.get<PaginatedMessagesResponse>(
    `/conversations/${conversationId}/messages`,
    {
      params: {
        limit: params?.limit,
        cursor: params?.cursor,
      },
    }
  );
  return response.data;
}

/**
 * Send a message to a conversation.
 * Transmits optional client-generated idempotencyKey to prevent duplicate row creation upon retries (ADR-003).
 */
export async function sendMessage(
  conversationId: string,
  input: SendMessageInput
): Promise<MessageResponse> {
  const response = await apiClient.post<SendMessageResponse>(
    `/conversations/${conversationId}/messages`,
    input
  );
  return response.data.message;
}

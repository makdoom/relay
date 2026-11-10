export type MessageStatus = 'pending' | 'sent' | 'failed';

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  idempotencyKey: string | null;
  createdAt: string;
}

export interface MessageItem {
  id: string; // Temporary ID (UUID) while pending, or durable server UUIDv7 once sent
  conversationId: string;
  senderId: string;
  content: string;
  idempotencyKey: string;
  createdAt: string;
  status: MessageStatus;
  error?: string;
}

export interface SendMessageInput {
  content: string;
  idempotencyKey?: string;
}

export interface ListMessagesParams {
  limit?: number;
  cursor?: string;
}

export interface PaginatedMessagesResponse {
  messages: MessageResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

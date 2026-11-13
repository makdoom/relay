import type { MessageResponse } from './message';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface SocketErrorPayload {
  code: string;
  message: string;
  statusCode?: number;
}

export type SocketAck<T> =
  | { success: true; data: T }
  | { success: false; error: SocketErrorPayload };

export interface SocketNewMessageEvent {
  message: MessageResponse;
}

export interface SocketHistorySyncInput {
  conversationId: string;
  cursor?: string;
  limit?: number;
}

export interface SocketConversationRoomInput {
  conversationId: string;
}

export interface SocketTypingUpdateEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface SocketPresenceUpdateEvent {
  userId: string;
  status: 'online' | 'offline';
}

export interface SocketReadReceiptEvent {
  conversationId: string;
  userId: string;
  lastReadMessageId: string;
  readAt: string;
}

export interface SocketReadUpdateInput {
  conversationId: string;
  lastReadMessageId: string;
}

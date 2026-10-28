import type { Server as BaseServer, Socket as BaseSocket } from 'socket.io';
import type {
  MessageResponse,
  PaginatedMessagesResponse,
} from '../modules/messages/messages.schema.js';
import type {
  SocketConversationRoomInput,
  SocketHistorySyncInput,
  SocketReadUpdateInput,
  SocketSendMessageInput,
  SocketTypingInput,
} from './schemas.js';

export interface SocketUser {
  id: string;
}

export interface SocketData {
  user: SocketUser;
}

// ============================================================================
// Acknowledgement & Error Contracts
// ============================================================================

export interface SocketErrorPayload {
  code: string;
  message: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Standard request-response acknowledgement shape returned to the caller via callback.
 */
export type SocketAck<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: SocketErrorPayload;
    };

// ============================================================================
// Message Event Payloads & State Separation
// ============================================================================

/**
 * PERSISTENCE ACKNOWLEDGEMENT (Returned directly to sender in ack callback)
 * Confirms that PostgreSQL has committed the message row transactionally.
 * Distinguishes newly created messages (isDuplicate: false) from idempotent retries (isDuplicate: true).
 */
export interface SocketMessageAckData {
  message: MessageResponse;
  isDuplicate: boolean;
}

/**
 * RECIPIENT DELIVERY (Broadcast to online participants in room `conversation:<id>`)
 * Represents live delivery of a persisted message to conversation members.
 * Note: Emitting this event proves only that bytes were dispatched, NOT that
 * the recipient viewed or read the message.
 */
export interface SocketNewMessageEvent {
  message: MessageResponse;
}

// ============================================================================
// Ephemeral Typing & Presence Event Payloads
// ============================================================================

/**
 * Live broadcast notifying room members of typing activity.
 * Excludes the sender; ephemeral and never written to database (ADR-008).
 */
export interface SocketTypingUpdateEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

/**
 * Broadcast notifying clients of a user's online/offline status.
 * Maintained in-memory with multi-socket connection reference counting.
 */
export interface SocketPresenceUpdateEvent {
  userId: string;
  status: 'online' | 'offline';
}

// ============================================================================
// Read State Event Payloads (Watermark Model per ADR-005)
// ============================================================================

/**
 * Persistence acknowledgement data returned to caller when updating their read watermark.
 */
export interface SocketReadUpdateAckData {
  conversationId: string;
  lastReadMessageId: string;
}

/**
 * READ RECEIPT BROADCAST (Broadcast to conversation members)
 * Confirms that a participant has actively read up to `lastReadMessageId`.
 * Delivery != Read.
 */
export interface SocketReadReceiptEvent {
  conversationId: string;
  userId: string;
  lastReadMessageId: string;
  readAt: string;
}

// ============================================================================
// Typed Client-to-Server and Server-to-Client Event Maps
// ============================================================================

/**
 * Events emitted by client sockets and handled by the server.
 */
export interface ClientToServerEvents {
  /**
   * Sends a message over the socket.
   * Callback returns the persistence acknowledgement.
   */
  'message:send': (
    payload: SocketSendMessageInput,
    ack: (response: SocketAck<SocketMessageAckData>) => void
  ) => void;

  /**
   * Joins an authorized conversation room (`conversation:<conversationId>`).
   * Server verifies conversation membership before admitting the socket.
   */
  'conversation:join': (
    payload: SocketConversationRoomInput,
    ack: (response: SocketAck<{ conversationId: string }>) => void
  ) => void;

  /**
   * Leaves a conversation room.
   */
  'conversation:leave': (
    payload: SocketConversationRoomInput,
    ack: (response: SocketAck<{ conversationId: string }>) => void
  ) => void;

  /**
   * Signals that the user started typing in a conversation.
   * Server broadcasts to other room members and starts an auto-expiry timer.
   */
  'typing:start': (payload: SocketTypingInput) => void;

  /**
   * Signals that the user stopped typing in a conversation.
   */
  'typing:stop': (payload: SocketTypingInput) => void;

  /**
   * Updates the user's read watermark (`last_read_message_id`) for a conversation.
   * Persists to PostgreSQL and broadcasts `read:update` to room members.
   */
  'read:update': (
    payload: SocketReadUpdateInput,
    ack: (response: SocketAck<SocketReadUpdateAckData>) => void
  ) => void;

  /**
   * Requests missed messages since a last-seen cursor (UUIDv7) after reconnection.
   * Returns paginated messages from PostgreSQL history.
   */
  'history:sync': (
    payload: SocketHistorySyncInput,
    ack: (response: SocketAck<PaginatedMessagesResponse>) => void
  ) => void;
}

/**
 * Events emitted by the server and received by connected clients.
 */
export interface ServerToClientEvents {
  /**
   * Real-time delivery of a persisted message to conversation room members.
   */
  'message:new': (payload: SocketNewMessageEvent) => void;

  /**
   * Typing activity change broadcast.
   */
  'typing:update': (payload: SocketTypingUpdateEvent) => void;

  /**
   * User presence change broadcast.
   */
  'presence:update': (payload: SocketPresenceUpdateEvent) => void;

  /**
   * Conversation read watermark advancement broadcast.
   */
  'read:update': (payload: SocketReadReceiptEvent) => void;

  /**
   * Unhandled or asynchronous socket error emitted to a specific socket.
   */
  error: (error: SocketErrorPayload) => void;
}

// Internal server events
export type InterServerEvents = {};

export type AppSocket = BaseSocket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocketServer = BaseServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export interface SocketAuthError extends Error {
  code?: string;
  data?: {
    code: string;
    statusCode: number;
  };
}

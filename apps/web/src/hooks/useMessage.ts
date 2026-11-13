import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMessageHistory, sendMessage } from '@/api/message.api';
import type { MessageItem, MessageResponse, PaginatedMessagesResponse } from '@/types/message';
import type { SocketAck, SocketNewMessageEvent, SocketReadReceiptEvent } from '../types/socket';
import { useSocket } from './useSocket';

export interface UseMessagesReturn {
  messages: MessageItem[];
  isLoadingHistory: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  peerLastReadMessageId: string | null;
  loadOlderMessages: () => Promise<void>;
  sendTextMessage: (content: string) => Promise<void>;
  retryMessage: (tempId: string) => Promise<void>;
}

/**
 * Custom hook managing conversation message state, HTTP pagination,
 * optimistic updates, and real-time Socket.IO synchronization (Milestone 7.6 & Read Receipts).
 */
export function useMessages(
  conversationId: string | null,
  currentUserId: string | undefined,
  initialPeerLastReadMessageId?: string | null
): UseMessagesReturn {
  const { socket, connectionStatus } = useSocket();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [peerLastReadMessageId, setPeerLastReadMessageId] = useState<string | null>(
    initialPeerLastReadMessageId ?? null
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync peerLastReadMessageId state when initial value or conversation changes
  useEffect(() => {
    setPeerLastReadMessageId(initialPeerLastReadMessageId ?? null);
  }, [conversationId, initialPeerLastReadMessageId]);

  // Keep refs to avoid stale closures during async callbacks
  const messagesRef = useRef<MessageItem[]>([]);
  messagesRef.current = messages;

  const activeConvIdRef = useRef<string | null>(conversationId);
  activeConvIdRef.current = conversationId;

  // Track the previously joined socket room to cleanly leave upon change
  const joinedRoomRef = useRef<string | null>(null);

  // 1. Initial HTTP message history fetch when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setHasMore(false);
      setNextCursor(null);
      setError(null);
      setIsLoadingHistory(false);
      return;
    }

    let isMounted = true;
    setIsLoadingHistory(true);
    setError(null);
    setMessages([]);

    fetchMessageHistory(conversationId, { limit: 20 })
      .then((res) => {
        if (!isMounted) return;
        // Backend returns newest first. Chronological timeline rendering requires reversing.
        const chronological: MessageItem[] = res.messages
          .slice()
          .reverse()
          .map((m: MessageResponse) => ({
            id: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            content: m.content,
            idempotencyKey: m.idempotencyKey || m.id,
            createdAt: m.createdAt,
            status: 'sent',
          }));

        setMessages(chronological);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load messages';
        setError(msg);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  // 2. Real-time catch-up sync helper
  const syncMissedMessages = useCallback(
    (targetConvId: string) => {
      if (!socket?.connected) return;

      // Find newest confirmed message in current timeline as catch-up cursor
      const sent = messagesRef.current.filter((m) => m.status === 'sent');
      const latestMessage = sent[sent.length - 1];
      if (!latestMessage) return;

      socket.emit(
        'history:sync',
        { conversationId: targetConvId, cursor: latestMessage.id, limit: 50 },
        (ack: SocketAck<PaginatedMessagesResponse>) => {
          if (activeConvIdRef.current !== targetConvId) return;
          if (ack?.success && ack.data.messages.length > 0) {
            const incoming: MessageItem[] = ack.data.messages.map((m) => ({
              id: m.id,
              conversationId: m.conversationId,
              senderId: m.senderId,
              content: m.content,
              idempotencyKey: m.idempotencyKey || m.id,
              createdAt: m.createdAt,
              status: 'sent',
            }));

            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const deduplicated = incoming.filter((m) => !existingIds.has(m.id));
              if (deduplicated.length === 0) return prev;
              return [...prev, ...deduplicated];
            });
          }
        }
      );
    },
    [socket]
  );

  // 3. Socket.IO Room Joining & Event Subscriptions
  useEffect(() => {
    if (!socket || !conversationId) {
      if (joinedRoomRef.current && socket?.connected) {
        socket.emit('conversation:leave', { conversationId: joinedRoomRef.current });
        joinedRoomRef.current = null;
      }
      return;
    }

    // Leave previous room if switching conversations
    if (joinedRoomRef.current && joinedRoomRef.current !== conversationId && socket.connected) {
      socket.emit('conversation:leave', { conversationId: joinedRoomRef.current });
    }

    // Join current conversation room
    if (socket.connected) {
      socket.emit('conversation:join', { conversationId });
      joinedRoomRef.current = conversationId;
    }

    // Listener for live incoming messages from other participants or tabs
    const handleNewMessage = (payload: SocketNewMessageEvent) => {
      const incoming = payload.message;
      if (incoming.conversationId !== activeConvIdRef.current) return;

      setMessages((prev) => {
        // If already present by durable ID, do not duplicate
        if (prev.some((m) => m.id === incoming.id)) {
          return prev;
        }

        // If matching pending optimistic message by idempotencyKey, update to sent
        const pendingIdx = prev.findIndex(
          (m) =>
            m.status === 'pending' &&
            m.idempotencyKey &&
            m.idempotencyKey === incoming.idempotencyKey
        );

        if (pendingIdx !== -1) {
          const next = [...prev];
          next[pendingIdx] = {
            id: incoming.id,
            conversationId: incoming.conversationId,
            senderId: incoming.senderId,
            content: incoming.content,
            idempotencyKey: incoming.idempotencyKey || incoming.id,
            createdAt: incoming.createdAt,
            status: 'sent',
          };
          return next;
        }

        // Otherwise append fresh incoming message
        return [
          ...prev,
          {
            id: incoming.id,
            conversationId: incoming.conversationId,
            senderId: incoming.senderId,
            content: incoming.content,
            idempotencyKey: incoming.idempotencyKey || incoming.id,
            createdAt: incoming.createdAt,
            status: 'sent',
          },
        ];
      });
    };

    // Listener for peer read receipt broadcasts
    const handleReadUpdate = (event: SocketReadReceiptEvent) => {
      if (event.conversationId !== activeConvIdRef.current) return;
      if (event.userId === currentUserId) return; // Suppress own loopback

      setPeerLastReadMessageId((prev) => {
        if (!prev || event.lastReadMessageId > prev) {
          return event.lastReadMessageId;
        }
        return prev;
      });
    };

    // Listener for reconnection: re-join room and catch up missed messages
    const handleConnect = () => {
      if (activeConvIdRef.current) {
        socket.emit('conversation:join', { conversationId: activeConvIdRef.current });
        joinedRoomRef.current = activeConvIdRef.current;
        syncMissedMessages(activeConvIdRef.current);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('read:update', handleReadUpdate);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('read:update', handleReadUpdate);
      socket.off('connect', handleConnect);
      if (joinedRoomRef.current && socket.connected) {
        socket.emit('conversation:leave', { conversationId: joinedRoomRef.current });
        joinedRoomRef.current = null;
      }
    };
  }, [socket, conversationId, syncMissedMessages]);

  // When connection transitions to 'connected', join room and trigger catch-up if messages are loaded
  useEffect(() => {
    if (connectionStatus === 'connected' && conversationId && socket && socket.connected) {
      socket.emit('conversation:join', { conversationId });
      joinedRoomRef.current = conversationId;
      syncMissedMessages(conversationId);
    }
  }, [connectionStatus, conversationId, socket, syncMissedMessages]);

  // 4. Auto-emit read watermark when viewing active conversation with confirmed messages
  const myReportedReadIdRef = useRef<string | null>(null);

  useEffect(() => {
    myReportedReadIdRef.current = null;
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !socket.connected || !conversationId) return;

    const confirmed = messages.filter((m) => m.status === 'sent');
    if (confirmed.length === 0) return;

    const newest = confirmed[confirmed.length - 1];
    if (!newest) return;

    if (!myReportedReadIdRef.current || newest.id > myReportedReadIdRef.current) {
      myReportedReadIdRef.current = newest.id;
      socket.emit('read:update', {
        conversationId,
        lastReadMessageId: newest.id,
      });
    }
  }, [messages, socket, conversationId, connectionStatus]);

  // 5. Load older messages (keyset pagination upwards)
  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || !nextCursor || !hasMore || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const res = await fetchMessageHistory(conversationId, {
        limit: 20,
        cursor: nextCursor,
      });

      // Older messages chronologically reversed
      const olderChronological: MessageItem[] = res.messages
        .slice()
        .reverse()
        .map((m: MessageResponse) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: m.content,
          idempotencyKey: m.idempotencyKey || m.id,
          createdAt: m.createdAt,
          status: 'sent',
        }));

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const deduplicatedOlder = olderChronological.filter((m) => !existingIds.has(m.id));
        return [...deduplicatedOlder, ...prev];
      });

      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load older messages';
      setError(msg);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, nextCursor, hasMore, isLoadingMore]);

  // 5. Send new message with optimistic pending state
  const sendTextMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!conversationId || !currentUserId || !trimmed) {
        return;
      }

      const tempId = crypto.randomUUID();
      const idempotencyKey = crypto.randomUUID();

      const pendingMessage: MessageItem = {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        content: trimmed,
        idempotencyKey,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      // Optimistically append to timeline
      setMessages((prev) => [...prev, pendingMessage]);

      try {
        const response = await sendMessage(conversationId, {
          content: trimmed,
          idempotencyKey,
        });

        if (activeConvIdRef.current !== conversationId) return;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: response.id,
                  createdAt: response.createdAt,
                  status: 'sent',
                }
              : m
          )
        );
      } catch (err: unknown) {
        if (activeConvIdRef.current !== conversationId) return;

        const errorMsg = err instanceof Error ? err.message : 'Message failed to send';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  status: 'failed',
                  error: errorMsg,
                }
              : m
          )
        );
      }
    },
    [conversationId, currentUserId]
  );

  // 6. Retry failed send preserving the exact same idempotencyKey (ADR-003)
  const retryMessage = useCallback(
    async (tempId: string) => {
      if (!conversationId) return;

      const target = messagesRef.current.find((m) => m.id === tempId);
      if (!target || target.status !== 'failed') return;

      // Transition to pending
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'pending', error: undefined } : m))
      );

      try {
        const response = await sendMessage(conversationId, {
          content: target.content,
          idempotencyKey: target.idempotencyKey, // Reuses identical idempotencyKey
        });

        if (activeConvIdRef.current !== conversationId) return;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: response.id,
                  createdAt: response.createdAt,
                  status: 'sent',
                }
              : m
          )
        );
      } catch (err: unknown) {
        if (activeConvIdRef.current !== conversationId) return;

        const errorMsg = err instanceof Error ? err.message : 'Retry failed to send';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  status: 'failed',
                  error: errorMsg,
                }
              : m
          )
        );
      }
    },
    [conversationId]
  );

  return {
    messages,
    isLoadingHistory,
    isLoadingMore,
    hasMore,
    error,
    peerLastReadMessageId,
    loadOlderMessages,
    sendTextMessage,
    retryMessage,
  };
}

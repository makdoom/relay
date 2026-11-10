import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMessageHistory, sendMessage } from '@/api/message.api';
import { toast } from '@/components/ui/sonner';
import type { MessageItem, MessageResponse } from '@/types/message';

export interface UseMessagesReturn {
  messages: MessageItem[];
  isLoadingHistory: boolean;
  // isLoadingMore: boolean;
  // hasMore: boolean;
  // error: string | null;
  // peerLastReadMessageId: string | null;
  loadOlderMessages: () => Promise<void>;
  sendTextMessage: (content: string) => Promise<void>;
  // retryMessage: (tempId: string) => Promise<void>;
}

export const useMessage = (
  conversationId: string | null,
  currentUserId: string | undefined,
  initialPeerLastReadMessageId?: string | null
): UseMessagesReturn => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const activeConvIdRef = useRef<string | null>(conversationId);
  activeConvIdRef.current = conversationId;

  // 1. Initial HTTP message history fetch when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setHasMore(false);
      setNextCursor(null);
      setIsLoadingHistory(false);
      return;
    }

    let isMounted = true;
    setIsLoadingHistory(true);
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
        toast.error(msg);
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
      toast.error(msg);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, nextCursor, hasMore, isLoadingMore]);

  // 6. Send new message with optimistic pending state
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

  return {
    messages,
    sendTextMessage,
    isLoadingHistory,
    loadOlderMessages,
    // retryMessage,
    // isLoadingMore,
    // hasMore,
    // error,
    // peerLastReadMessageId,
  };
};

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SocketTypingUpdateEvent } from '../types/socket';
import { useSocket } from './useSocket';

export interface UseTypingIndicatorReturn {
  typingUserIds: string[];
  sendTypingStart: () => void;
  sendTypingStop: () => void;
}

/**
 * Hook to manage real-time ephemeral typing indicators for a conversation.
 * Handles debouncing keystrokes, automatic timeout cleanup, and incoming
 * live broadcasts per ADR-008.
 */
export function useTypingIndicator(
  conversationId: string | null,
  currentUserId: string | undefined
): UseTypingIndicatorReturn {
  const { socket } = useSocket();
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const isTypingRef = useRef<boolean>(false);
  const stopTimeoutRef = useRef<number | null>(null);

  // Clear state when active conversation changes
  useEffect(() => {
    setTypingUserIds([]);
    isTypingRef.current = false;
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, [conversationId]);

  // Listen for typing:update broadcasts from room members
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleTypingUpdate = (payload: SocketTypingUpdateEvent) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === currentUserId) return; // Suppress self-loopback

      setTypingUserIds((prev) => {
        if (payload.isTyping) {
          return prev.includes(payload.userId) ? prev : [...prev, payload.userId];
        } else {
          return prev.filter((id) => id !== payload.userId);
        }
      });
    };

    socket.on('typing:update', handleTypingUpdate);

    return () => {
      socket.off('typing:update', handleTypingUpdate);
    };
  }, [socket, conversationId, currentUserId]);

  // Emit typing:start debounced
  const sendTypingStart = useCallback(() => {
    if (!socket || !socket.connected || !conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', { conversationId });
    }

    // Refresh debounce timer: emit typing:stop after 2.5s of typing inactivity
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
    }

    stopTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && socket.connected && conversationId) {
        socket.emit('typing:stop', { conversationId });
        isTypingRef.current = false;
      }
    }, 2500);
  }, [socket, conversationId]);

  // Emit typing:stop immediately (e.g. on send or blur)
  const sendTypingStop = useCallback(() => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    if (isTypingRef.current && socket && socket.connected && conversationId) {
      socket.emit('typing:stop', { conversationId });
      isTypingRef.current = false;
    }
  }, [socket, conversationId]);

  return {
    typingUserIds,
    sendTypingStart,
    sendTypingStop,
  };
}

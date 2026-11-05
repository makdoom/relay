import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { listConversations } from '@/api/conversation.api';
import { ConversationContext, type ConversationContextValue } from '@/context/ConversationContext';
import { useAuth } from '@/hooks/useAuth';
import type { ConversationListItem } from '@/types/conversation';

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  // const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversationList = useCallback(async () => {
    if (!user) {
      setConversations([]);
      // setSelectedConversationId(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const items = await listConversations();
      setConversations(items);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch when authenticated user changes
  useEffect(() => {
    fetchConversationList();
  }, [fetchConversationList]);

  const value: ConversationContextValue = {
    conversations,
    isLoading,
    error,
  };

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

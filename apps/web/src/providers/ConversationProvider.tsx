import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { createOrGetDirectConversation, listConversations } from '@/api/conversation.api';
import { ConversationContext, type ConversationContextValue } from '@/context/ConversationContext';
import { useAuth } from '@/hooks/useAuth';
import type { ConversationFilter, ConversationListItem } from '@/types/conversation';

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [isUserSearchOpen, setIsUserSearchOpen] = useState<boolean>(false);

  const fetchConversationList = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setSelectedConversationId(null);
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

  const refreshConversations = useCallback(async () => {
    await fetchConversationList();
  }, [fetchConversationList]);

  const startDirectChat = useCallback(
    async (recipientId: string): Promise<string> => {
      const record = await createOrGetDirectConversation({ recipientId });
      // Refresh list to include newly created conversation or bump existing
      await fetchConversationList();
      setSelectedConversationId(record.id);
      return record.id;
    },
    [fetchConversationList]
  );

  const filteredConversations = useMemo(() => {
    if (filter === 'direct') {
      return conversations.filter((c) => c.type === 'direct');
    }
    if (filter === 'group') {
      return conversations.filter((c) => c.type === 'group');
    }
    return conversations;
  }, [conversations, filter]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return conversations.find((c) => c.id === selectedConversationId) ?? null;
  }, [conversations, selectedConversationId]);

  // Initial fetch when authenticated user changes
  useEffect(() => {
    fetchConversationList();
  }, [fetchConversationList]);

  const value: ConversationContextValue = {
    conversations,
    filteredConversations,
    selectedConversationId,
    selectedConversation,
    isUserSearchOpen,
    setIsUserSearchOpen,
    filter,
    isLoading,
    error,
    setSelectedConversationId,
    setFilter,
    refreshConversations,
    startDirectChat,
  };

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

import { createContext, type Dispatch, type SetStateAction } from 'react';
import type { ConversationFilter, ConversationListItem } from '@/types/conversation';

export type ConversationContextValue = {
  conversations: ConversationListItem[];
  filteredConversations: ConversationListItem[];
  isLoading: boolean;
  error: string | null;
  isUserSearchOpen: boolean;
  setIsUserSearchOpen: Dispatch<SetStateAction<boolean>>;
  selectedConversationId: string | null;
  selectedConversation: ConversationListItem | null;
  setSelectedConversationId: (id: string | null) => void;
  refreshConversations: () => Promise<void>;
  startDirectChat: (recipientId: string) => Promise<string>;
  filter: ConversationFilter;
  setFilter: (filter: ConversationFilter) => void;
};

export const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

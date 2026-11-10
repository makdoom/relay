import { createContext, type Dispatch, type SetStateAction } from 'react';
import type {
  ConversationFilter,
  ConversationListItem,
  CreateGroupInput,
} from '@/types/conversation';

export type ConversationContextValue = {
  conversations: ConversationListItem[];
  filteredConversations: ConversationListItem[];
  isLoading: boolean;
  error: string | null;
  isUserSearchOpen: boolean;
  setIsUserSearchOpen: Dispatch<SetStateAction<boolean>>;
  isCreateGroupOpen: boolean;
  setIsCreateGroupOpen: Dispatch<SetStateAction<boolean>>;
  selectedConversationId: string | null;
  selectedConversation: ConversationListItem | null;
  setSelectedConversationId: Dispatch<SetStateAction<string | null>>;
  refreshConversations: () => Promise<void>;
  startDirectChat: (recipientId: string) => Promise<string>;
  filter: ConversationFilter;
  setFilter: (filter: ConversationFilter) => void;
  createGroupChat: (input: CreateGroupInput) => Promise<string>;
};

export const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

import { createContext } from 'react';
import type { ConversationListItem } from '@/types/conversation';

export type ConversationContextValue = {
  conversations: ConversationListItem[];
  isLoading: boolean;
  error: string | null;
};

export const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

import { useContext } from 'react';
import { ConversationContext, type ConversationContextValue } from '@/context/ConversationContext';

export const useConversation = (): ConversationContextValue => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

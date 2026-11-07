import type { UserProfile } from './user';

export type ConversationType = 'direct' | 'group';

export type ConversationFilter = 'all' | 'direct' | 'group';

export type DirectConversationListItem = {
  id: string;
  type: 'direct';
  recipient: UserProfile;
  createdAt: string;
  updatedAt: string;
};

export type GroupConversationListItem = {
  id: string;
  type: 'group';
  title: string | null;
  role: 'admin' | 'member' | string;
  createdAt: string;
  updatedAt: string;
};

export type ConversationListItem = DirectConversationListItem | GroupConversationListItem;

export interface ListConversationsResponse {
  conversations: ConversationListItem[];
}

export interface ConversationRecord {
  id: string;
  type: ConversationType;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListConversationsResponse {
  conversations: ConversationListItem[];
}

export interface DirectConversationResponse {
  conversation: ConversationRecord;
}

export interface CreateDirectConversationInput {
  recipientId: string;
}

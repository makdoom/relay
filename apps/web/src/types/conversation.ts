import type { UserProfile } from './user';

export type ConversationType = 'direct' | 'group';

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

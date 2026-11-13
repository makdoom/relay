import type { UserProfile } from './user';

export type ConversationType = 'direct' | 'group';

export interface LastMessagePreview {
  content: string;
  senderId: string;
  createdAt: string;
}

export interface DirectConversationListItem {
  id: string;
  type: 'direct';
  recipient: UserProfile;
  recipientLastReadMessageId?: string | null;
  lastReadMessageId?: string | null;
  unreadCount?: number;
  lastMessage?: LastMessagePreview | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupConversationListItem {
  id: string;
  type: 'group';
  title: string | null;
  role: 'admin' | 'member' | string;
  lastReadMessageId?: string | null;
  unreadCount?: number;
  lastMessage?: LastMessagePreview | null;
  createdAt: string;
  updatedAt: string;
}

export type ConversationListItem = DirectConversationListItem | GroupConversationListItem;

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

export interface GroupMemberItem {
  userId: string;
  role: 'admin' | 'member' | string;
  joinedAt: string;
  leftAt: string | null;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
  name: string;
  username: string;
}

export interface CreateGroupInput {
  title: string;
  memberIds?: string[];
}

export interface GroupConversationResponse {
  conversation: {
    id: string;
    type: 'group';
    title: string | null;
    createdAt: string;
    updatedAt: string;
    members: GroupMemberItem[];
  };
}

export interface GroupMembersResponse {
  members: GroupMemberItem[];
}

export type ConversationFilter = 'all' | 'direct' | 'group' | 'unread';

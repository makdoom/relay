import { ForbiddenError } from '../../error/index.js';

export type ConversationType = 'direct' | 'group';
export type MemberRole = 'member' | 'admin';

export interface MinimalConversation {
  id: string;
  type: ConversationType | string;
}

export interface MinimalMember {
  userId: string;
  role: MemberRole | string;
  leftAt: Date | null;
}

/**
 * Checks if the requester has permission to add or remove members in a conversation.
 * Direct chats: immutable, neither member can add/remove.
 * Group chats: only active admins can manage members.
 */
export const canManageMembers = (
  conversation: MinimalConversation,
  requester: MinimalMember | null | undefined
): boolean => {
  if (!requester || conversation.type !== 'group') return false;

  return requester.leftAt === null && requester.role === 'admin';
};

/**
 * Checks if the requester has permission to update group details (e.g. title).
 * Direct chats: immutable.
 * Group chats: only active admins.
 */
export const canUpdateGroup = (
  conversation: MinimalConversation,
  requester: MinimalMember | null | undefined
): boolean => {
  if (!requester || conversation.type !== 'group') return false;

  return requester.leftAt === null && requester.role === 'admin';
};

/**
 * Checks if the requester has permission to send messages to the conversation.
 * Must be an active member (leftAt is null).
 */
export const canSendMessages = (
  _conversation: MinimalConversation,
  requester: MinimalMember | null | undefined
): boolean => {
  if (!requester) return false;

  return requester.leftAt === null;
};

/**
 * Checks if the requester can voluntarily leave the conversation.
 * Direct chats cannot be left.
 * Group members can leave if they haven't already departed.
 */
export const canLeaveConversation = (
  conversation: MinimalConversation,
  requester: MinimalMember | null | undefined
): boolean => {
  if (!requester || conversation.type !== 'group') return false;

  return requester.leftAt === null;
};

/**
 * Validates sole admin departure rule.
 * An admin cannot leave if they are the sole admin and other active members exist.
 */
export const canSoleAdminLeave = (
  activeAdminsCount: number,
  totalActiveMembersCount: number
): boolean => {
  if (totalActiveMembersCount <= 1) return true;
  return activeAdminsCount > 1;
};

/**
 * Bounded history access rule:
 * - Active members can access all messages.
 * - Departed members can only access messages sent before or at their departure timestamp.
 * - Non-members cannot access any messages.
 */
export const canAccessMessageHistory = (
  _conversation: MinimalConversation,
  requester: MinimalMember | null | undefined,
  messageCreatedAt?: Date
): boolean => {
  if (!requester) return false;
  if (requester.leftAt === null) return true;
  if (!messageCreatedAt) return true;

  return messageCreatedAt.getTime() <= requester.leftAt.getTime();
};

/**
 * Asserts that the requester can manage group members; throws ForbiddenError if denied.
 */
export function assertCanManageMembers(
  conversation: MinimalConversation,
  requester: MinimalMember | null | undefined
): void {
  if (!requester) {
    throw new ForbiddenError('You are not a member of this conversation', 'NOT_A_MEMBER');
  }
  if (conversation.type !== 'group') {
    throw new ForbiddenError(
      'Direct conversations do not support member management',
      'DIRECT_CONVERSATION_IMMUTABLE'
    );
  }
  if (requester.leftAt !== null) {
    throw new ForbiddenError('Departed members cannot manage group members', 'MEMBER_DEPARTED');
  }
  if (requester.role !== 'admin') {
    throw new ForbiddenError('Only group admins can manage members', 'ADMIN_ROLE_REQUIRED');
  }
}

/**
 * Asserts that the requester can update group details; throws ForbiddenError if denied.
 */
export function assertCanUpdateGroup(
  conversation: MinimalConversation,
  requester: MinimalMember | null | undefined
): void {
  if (!requester) {
    throw new ForbiddenError('You are not a member of this conversation', 'NOT_A_MEMBER');
  }
  if (conversation.type !== 'group') {
    throw new ForbiddenError(
      'Direct conversations cannot be updated',
      'DIRECT_CONVERSATION_IMMUTABLE'
    );
  }
  if (requester.leftAt !== null) {
    throw new ForbiddenError('Departed members cannot update group details', 'MEMBER_DEPARTED');
  }
  if (requester.role !== 'admin') {
    throw new ForbiddenError('Only group admins can update group details', 'ADMIN_ROLE_REQUIRED');
  }
}

/**
 * Asserts that the requester can send messages; throws ForbiddenError if denied.
 */
export function assertCanSendMessages(
  _conversation: MinimalConversation,
  requester: MinimalMember | null | undefined
): void {
  if (!requester) {
    throw new ForbiddenError('You are not a member of this conversation', 'NOT_A_MEMBER');
  }
  if (requester.leftAt !== null) {
    throw new ForbiddenError(
      'Departed members cannot send messages',
      'CANNOT_SEND_TO_LEFT_CONVERSATION'
    );
  }
}

/**
 * Asserts that the requester can leave the conversation; throws ForbiddenError if denied.
 */
export function assertCanLeaveConversation(
  conversation: MinimalConversation,
  requester: MinimalMember | null | undefined,
  activeAdminsCount?: number,
  totalActiveMembersCount?: number
): void {
  if (!requester) {
    throw new ForbiddenError('You are not a member of this conversation', 'NOT_A_MEMBER');
  }
  if (conversation.type !== 'group') {
    throw new ForbiddenError(
      'Direct conversations cannot be left',
      'CANNOT_LEAVE_DIRECT_CONVERSATION'
    );
  }
  if (requester.leftAt !== null) {
    throw new ForbiddenError(
      'You have already left this conversation',
      'ALREADY_LEFT_CONVERSATION'
    );
  }
  if (
    activeAdminsCount !== undefined &&
    totalActiveMembersCount !== undefined &&
    requester.role === 'admin' &&
    !canSoleAdminLeave(activeAdminsCount, totalActiveMembersCount)
  ) {
    throw new ForbiddenError(
      'Sole admin cannot leave group with other active members without appointing another admin',
      'SOLE_ADMIN_CANNOT_LEAVE'
    );
  }
}

/**
 * Asserts that the requester can access historical messages; throws ForbiddenError if denied.
 */
export function assertCanAccessMessageHistory(
  _conversation: MinimalConversation,
  requester: MinimalMember | null | undefined,
  messageCreatedAt?: Date
): void {
  if (!requester) {
    throw new ForbiddenError('You are not a member of this conversation', 'NOT_A_MEMBER');
  }
  if (
    requester.leftAt !== null &&
    messageCreatedAt &&
    messageCreatedAt.getTime() > requester.leftAt.getTime()
  ) {
    throw new ForbiddenError(
      'Cannot access messages sent after departure from the conversation',
      'MESSAGE_ACCESS_BOUNDED'
    );
  }
}

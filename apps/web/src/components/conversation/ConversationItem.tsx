import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { cn } from '@/lib/utils';
import type { ConversationListItem } from '@/types/conversation';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../ui/item';

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

const ConversationItem = ({ conversation }: { conversation: ConversationListItem }) => {
  const { user } = useAuth();

  const { setSelectedConversationId, selectedConversationId } = useConversation();
  const unreadCount = conversation.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;

  // Direct chat UI
  if (conversation.type === 'direct') {
    const initials = conversation.recipient.name
      ? conversation.recipient.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : conversation.recipient.username.slice(0, 2).toUpperCase();

    const previewText = conversation.lastMessage
      ? conversation.lastMessage.senderId === user?.id
        ? `You: ${conversation.lastMessage.content}`
        : conversation.lastMessage.content
      : `@${conversation.recipient.username}`;

    return (
      <Item
        variant="default"
        className={cn(
          `cursor-pointer hover:bg-muted p-2 gap-2`,
          selectedConversationId === conversation.id && 'bg-muted'
        )}
        onClick={() => setSelectedConversationId(conversation.id)}
      >
        <ItemMedia>
          <Avatar className="size-9">
            {/* <AvatarImage src="https://githusb.com/evilrabbit.png" /> */}
            <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent className="leading-none">
          <ItemTitle>{conversation.recipient.name}</ItemTitle>
          <ItemDescription className="text-xs">
            {previewText}

            {hasUnread && (
              <span
                className="shrink-0 min-w-4.5 h-4.5 px-1.5 rounded-full bg-emerald-500 text-black text-[10px] font-mono font-bold flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150"
                title={`${unreadCount} unread`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </ItemDescription>
        </ItemContent>
        <ItemContent>
          <ItemDescription className="text-xs">
            {formatTimestamp(conversation.updatedAt)}
          </ItemDescription>
        </ItemContent>
      </Item>
    );
  }

  return (
    <Item
      variant="default"
      className={cn(
        `cursor-pointer hover:bg-muted p-2 gap-2`,
        selectedConversationId === conversation.id && 'bg-muted'
      )}
      onClick={() => setSelectedConversationId(conversation.id)}
    >
      <ItemMedia>
        <Avatar className="size-9">
          {/* <AvatarImage src="https://gitshub.com/evilrabbit.png" /> */}
          <AvatarFallback className="text-sm font-semibold">#</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent className="leading-none">
        <ItemTitle className="text-sm">{conversation.title}</ItemTitle>
        <ItemDescription className="text-xs">Last seen 5 months ago</ItemDescription>
      </ItemContent>
      <ItemContent>
        <ItemDescription className="text-xs">12 :43 PM</ItemDescription>
      </ItemContent>
    </Item>
  );
};
export default ConversationItem;

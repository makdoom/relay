import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConversation } from '@/hooks/useConversation';
import { cn, formatTimestamp } from '@/lib/utils';
import type { ConversationListItem } from '@/types/conversation';

type ConversationItemType = {
  conversation: ConversationListItem;
};

const ConversationItem = ({ conversation }: ConversationItemType) => {
  const { selectedConversationId, setSelectedConversationId } = useConversation();
  const isSelected = conversation.id === selectedConversationId;

  if (conversation.type === 'direct') {
    const initials = conversation.recipient.name
      ? conversation.recipient.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : conversation.recipient.username.slice(0, 2).toUpperCase();
    return (
      <button
        type="button"
        onClick={() => {
          setSelectedConversationId(conversation.id);
        }}
        className={cn(
          `w-full text-left p-2.5 py-3 flex items-center gap-3 cursor-pointer group hover:bg-secondary/50 border-b outline-none`,
          isSelected ? `bg-secondary` : 'bg-transparent'
        )}
      >
        <Avatar className="relative">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>{initials}</AvatarFallback>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0c0d0e]" />
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-sm font-semibold truncate">{conversation.recipient.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatTimestamp(conversation.updatedAt)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            @{conversation.recipient.username}
          </div>
        </div>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setSelectedConversationId(conversation.id);
      }}
      className={cn(
        `w-full text-left p-2.5 py-3 flex items-center gap-3 cursor-pointer group hover:bg-secondary/50 border-b`,
        isSelected ? `bg-secondary` : 'bg-transparent'
      )}
    >
      <Avatar className="relative">
        <AvatarImage src="https://github.com/shadcn.png" />
        <AvatarFallback>#</AvatarFallback>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0c0d0e]" />
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-semibold truncate">{conversation.title}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatTimestamp(conversation.updatedAt)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">@{conversation.title}</div>
      </div>
    </button>
  );
};

export default ConversationItem;

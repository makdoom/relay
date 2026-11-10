import { useConversation } from '@/hooks/useConversation';
import { cn } from '@/lib/utils';
import type { ConversationListItem } from '@/types/conversation';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../ui/item';

const ConversationItem = ({ conversation }: { conversation: ConversationListItem }) => {
  const { setSelectedConversationId, selectedConversationId } = useConversation();
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
          <ItemDescription className="text-xs">Last seen 5 months ago</ItemDescription>
        </ItemContent>
        <ItemContent>
          <ItemDescription className="text-xs">12 :43 PM</ItemDescription>
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

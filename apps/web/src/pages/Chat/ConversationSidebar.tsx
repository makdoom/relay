import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';
import type { ConversationListItem } from '@/types/conversation';
import ConversationItem from './ConversationItem';
import EmptyConversation from './EmptyConversation';

const ConversationSidebar = () => {
  const { conversations, isLoading, error } = useConversation();
  console.log(conversations);
  return (
    <div className="w-80 border-r flex flex-col shrink-0 select-none">
      <div className="h-12 flex items-center justify-between px-3.5 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Chats</span>
        </div>
        <Button variant="secondary">
          <PlusIcon />
          New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Empty states */}
        {!isLoading && !error && conversations.length === 0 && <EmptyConversation />}

        {!isLoading &&
          !error &&
          conversations.map((conversation: ConversationListItem) => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
      </div>
    </div>
  );
};

export default ConversationSidebar;

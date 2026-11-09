import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useConversation } from '@/hooks/useConversation';
import type { ConversationListItem } from '@/types/conversation';
import ConversationItem from './ConversationItem';
import EmptyConversation from './EmptyConversation';
import ErrorConversation from './ErrorConversation';

const ConversationSidebar = () => {
  const { filteredConversations, isLoading, error, setIsUserSearchOpen } = useConversation();

  return (
    <div className="w-80 border-r flex flex-col shrink-0 select-none">
      <div className="h-12 flex items-center justify-between px-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Chats</span>
        </div>
        <Button variant="secondary" onClick={() => setIsUserSearchOpen(true)}>
          <PlusIcon />
          New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Skeleton loading */}
        {isLoading && (
          <div className="space-y-4 py-1 mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="flex items-center gap-4 w-full px-2">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-52" />
                  <Skeleton className="h-3 w-38" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Alert with Retry */}
        {!isLoading && error && <ErrorConversation />}

        {/* Empty states */}
        {!isLoading && !error && filteredConversations.length === 0 && <EmptyConversation />}

        {!isLoading &&
          !error &&
          filteredConversations.map((conversation: ConversationListItem) => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
      </div>
    </div>
  );
};

export default ConversationSidebar;

import { MessageSquare, PlusIcon, Users } from 'lucide-react';
import { useConversation } from '@/hooks/useConversation';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ConversationList from './ConversationList';
import EmptyConversation from './EmptyConversation';
import ErrorConversation from './ErrorConversation';

const ConversationSidebar = () => {
  const { isLoading, error, filteredConversations } = useConversation();

  console.log(filteredConversations);

  return (
    <div className="w-86 border-r flex flex-col shrink-0 select-none h-full min-h-0">
      <div className="h-12 flex items-center justify-between p-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Chats</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="secondary" className="text-xs h-8">
                <PlusIcon />
                New
              </Button>
            }
          />
          <DropdownMenuContent className="w-40">
            <DropdownMenuItem className="gap-2 text-muted-foreground">
              <MessageSquare className="size-3.5" />
              <span className="text-sm">Direct Chat</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-muted-foreground">
              <Users className="size-3.5" />
              <span className="text-sm">Group Chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Loading UI */}
      {isLoading && (
        <div className="flex flex-col space-y-3 px-2 my-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
          <div className="space-y-4 py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 10].map((item) => (
              <div key={item} className="flex items-center gap-4 w-full px-2">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-52" />
                  <Skeleton className="h-3 w-38" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredConversations.length === 0 && <EmptyConversation />}

      {/* Error Conversation */}
      {!isLoading && error && <ErrorConversation />}

      {!isLoading && !error && (
        <Tabs defaultValue="all" className="flex flex-col flex-1 min-h-0 w-full p-2">
          <TabsList className="w-full border py-4.5 bg-transparent shrink-0">
            <TabsTrigger value="all" className="py-3.5 data-active:bg-secondary!">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="py-3.5 data-active:bg-secondary!">
              Unread
            </TabsTrigger>
            <TabsTrigger value="favourites" className="py-3.5 data-active:bg-secondary!">
              Favourites
            </TabsTrigger>
            <TabsTrigger value="group" className="py-3.5 data-active:bg-secondary!">
              Groups
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="all"
            className="flex flex-col flex-1 min-h-0 overflow-hidden focus:outline-none!"
          >
            <ConversationList type="all" />
          </TabsContent>
          <TabsContent
            value="unread"
            className="flex flex-col flex-1 min-h-0 overflow-hidden focus:outline-none!"
          >
            <span>Unread</span>
          </TabsContent>
          <TabsContent
            value="favourites"
            className="flex flex-col flex-1 min-h-0 overflow-hidden focus:outline-none!"
          >
            <span>Favourites</span>
          </TabsContent>
          <TabsContent
            value="group"
            className="flex flex-col flex-1 min-h-0 overflow-hidden focus:outline-none!"
          >
            <span>Groups</span>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
export default ConversationSidebar;

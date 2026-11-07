import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';

const EmptyConversation = () => {
  const { conversations } = useConversation();
  return (
    <div className="flex flex-col items-center justify-center text-center p-4 h-full">
      <div className="w-10 h-10 rounded-full border flex items-center justify-center mb-2">
        <MessageSquare className="w-4 h-4" />
      </div>
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3">
          <p className="text-sm font-semibold">No conversations yet</p>
          <p className="text-sm text-muted-foreground max-w-50">
            Search for teammates or press ⌘ + K to start your first chat.
          </p>
          <Button className="mt-4 h-8" variant="default" size="lg">
            Start a conversation
          </Button>
        </div>
      ) : (
        <>
          {/* <p className="text-xs font-medium text-zinc-300">No {filter} chats found</p> */}
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Try switching the filter to &ldquo;All&rdquo;.
          </p>
        </>
      )}
    </div>
  );
};

export default EmptyConversation;

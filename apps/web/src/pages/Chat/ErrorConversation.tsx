import { MessageCircleWarning, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';

const ErrorConversation = () => {
  let { error, refreshConversations } = useConversation();
  error = 'Some error occurred while loading';

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 h-full">
      <div className="w-11 h-11 rounded-full border border-destructive-foreground/20 flex items-center justify-center mb-2">
        <MessageCircleWarning className="w-4 h-4 text-destructive-foreground" />
      </div>
      <div className="flex flex-col items-center justify-center space-y-2">
        <p className="text-sm font-semibold">Failed to load conversations</p>
        <p className="text-sm text-muted-foreground max-w-50">{error}</p>
        <Button
          className="mt-4 h-8"
          variant="destructive"
          size="lg"
          onClick={() => refreshConversations()}
        >
          <RefreshCw /> Retry
        </Button>
      </div>
    </div>
  );
};

export default ErrorConversation;

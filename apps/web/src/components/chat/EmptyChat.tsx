import { Search, Sparkle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/button';

const EmptyChat = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 h-full items-center justify-center p-8 select-none">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        <div className="size-12 rounded-lg border flex items-center justify-center mb-6">
          <Sparkle className="size-6" />
        </div>

        <h2 className="text-lg font-semibold tracking-tight">
          Welcome to Relay{user?.name ? `, ${user.name}` : ''}
        </h2>

        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Select a conversation from the sidebar to view message history, or discover teammates to
          start a new direct chat.
        </p>

        <Button className="mt-6">
          <Search />
          Discover Teammates (⌘ + K)
        </Button>
      </div>
    </div>
  );
};
export default EmptyChat;

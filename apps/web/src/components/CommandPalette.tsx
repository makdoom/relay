import { CommandEmpty } from 'cmdk';
import { CommandIcon, Loader, SearchIcon, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { searchUsers } from '@/api/users.api';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useConversation } from '@/hooks/useConversation';
import type { UserProfile } from '@/types/user';
import { Kbd, KbdGroup } from './ui/kbd';
import { toast } from './ui/sonner';

const CommandPalette = () => {
  const { isUserSearchOpen, setIsUserSearchOpen, startDirectChat } = useConversation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);

  // ⌘K on a Mac, Ctrl+K elsewhere, from anywhere on the page.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsUserSearchOpen((previous) => !previous);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsUserSearchOpen]);

  const handleOpen = () => {
    setQuery('');
    setResults([]);
    setIsUserSearchOpen(true);
  };

  const handleSelectUser = async (user: UserProfile) => {
    try {
      setIsStartingChat(user.id);
      await startDirectChat(user.id);
      setIsUserSearchOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not open conversation';
      toast.error(message);
    } finally {
      setIsStartingChat(null);
    }
  };

  // Debounced user search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers({ query: trimmed, limit: 10 });
        setResults(users);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'User search failed';
        toast.error(message);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        className="justify-between text-muted-foreground h-8"
        onClick={handleOpen}
        variant="outline"
      >
        <span className="flex items-center gap-2">
          <SearchIcon aria-hidden="true" />
          Search people or conversations
        </span>
        <Kbd className="rounded-md font-semibold">
          <CommandIcon className="size-3" /> K
        </Kbd>
      </Button>
      <CommandDialog onOpenChange={setIsUserSearchOpen} open={isUserSearchOpen}>
        <Command>
          <CommandInput
            placeholder="Search people or conversations"
            value={query}
            onValueChange={(value) => setQuery(value)}
          />
          <CommandList className="py-2">
            {/* Initial State (Empty Query) */}
            {!isSearching && !query.trim() && (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="size-10 rounded-full border flex items-center justify-center mb-2">
                  <User className="size-5" />
                </div>
                <p className="text-sm font-medium">Discover teammates on Relay</p>
                <p className="text-xs mt-1 max-w-xs text-muted-foreground">
                  Type a name or @username to start a direct one-to-one conversation.
                </p>
              </div>
            )}

            {/* Active Searching Indicator */}
            {isSearching && (
              <div className="flex items-center justify-center gap-2 py-8 text-xs min-h-42 max-h-90">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Searching users...</span>
              </div>
            )}

            {!isSearching && results.length === 0 && query.trim() && (
              <CommandEmpty className="flex flex-col items-center justify-center py-10">
                <div className="size-10 rounded-full border flex items-center justify-center mb-2">
                  <Users className="size-5" />
                </div>
                <p className="text-sm font-semibold">No matches found</p>
                <p className="text-xs mt-1 max-w-xs text-muted-foreground">
                  Try adjusting your search query.
                </p>
              </CommandEmpty>
            )}

            {results.length > 0 && (
              <CommandGroup heading={`People (${results.length})`}>
                {results.map((user) => {
                  const isCurrentPending = isStartingChat === user.id;

                  return (
                    <CommandItem
                      key={user.username}
                      className="flex items-center cursor-pointer"
                      onSelect={() => handleSelectUser(user)}
                      value={user.username}
                      disabled={isStartingChat !== null}
                    >
                      <div className="size-8 border rounded-full text-sm flex justify-center items-center">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1">
                        <p className="text-sm!">{user.name}</p>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      </div>
                      {isCurrentPending && (
                        <div className="flex items-center gap-1 text-xs">
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                          <span>Opening...</span>
                        </div>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
          <div className="flex items-center justify-between gap-2 border-t bg-muted/48 px-4 py-3 text-muted-foreground text-xs">
            <span className="flex items-center gap-2">
              <KbdGroup>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
              </KbdGroup>
              Navigate
            </span>
            <span className="flex items-center gap-2">
              <Kbd>↵</Kbd>
              Select
            </span>
            <span className="flex items-center gap-2">
              <Kbd>Esc</Kbd>
              Close
            </span>
          </div>
        </Command>
      </CommandDialog>
    </div>
  );
};

export default CommandPalette;

import { Loader, SearchIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { searchUsers } from '@/api/users.api';
import { useConversation } from '@/hooks/useConversation';
import type { UserProfile } from '@/types/user';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Field, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../ui/item';
import { toast } from '../ui/sonner';

const CreateGroupDialog = () => {
  const { isCreateGroupOpen, setIsCreateGroupOpen, createGroupChat } = useConversation();
  const [memberQuery, setMemberQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMember = (user: UserProfile) => {
    setSelectedMembers((prev) => [...prev, user]);
    setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
    setMemberQuery('');
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreateGroup = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Group title is required');
      return;
    }
    if (trimmedTitle.length > 100) {
      toast.error('Group title cannot exceed 100 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await createGroupChat({
        title: trimmedTitle,
        memberIds: selectedMembers.map((m) => m.id),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create group';
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  // Focus title input on dialog open and reset form
  useEffect(() => {
    if (isCreateGroupOpen) {
      setTitle('');
      setMemberQuery('');
      setSearchResults([]);
      setSelectedMembers([]);
      setIsSubmitting(false);
    }
  }, [isCreateGroupOpen]);

  // Debounced search for teammates to invite
  useEffect(() => {
    const trimmed = memberQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers({ query: trimmed, limit: 10 });
        // Filter out already selected users
        const selectedIds = new Set(selectedMembers.map((m) => m.id));
        setSearchResults(users.filter((u) => !selectedIds.has(u.id)));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'User search failed';
        toast.error(msg);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [memberQuery, selectedMembers]);

  return (
    <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-sm">Create Group Conversation</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create a new group conversation by adding members.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 my-3">
          <FieldGroup>
            <Field>
              <FieldLabel className="text-xs">Group Name</FieldLabel>
              <Input
                name="name"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="h-8"
                placeholder="eg: General Chat, Core Team"
              />
            </Field>

            <Field>
              <FieldLabel className="text-xs ">Invite Members</FieldLabel>
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-1">
                  {selectedMembers.map((member) => (
                    <Badge
                      key={member.id}
                      variant="outline"
                      className="text-xs px-3.5 text-muted-foreground hover:text-primary cursor-pointer rounded-md"
                      size="lg"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      {member.name}
                      <X className="size-2" />
                    </Badge>
                  ))}
                </div>
              )}

              <InputGroup className="w-full h-8">
                <InputGroupInput
                  placeholder="Search people by name or @username"
                  type="text"
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                />
                <InputGroupAddon>
                  <SearchIcon aria-hidden="true" />
                </InputGroupAddon>
                {isSearching ? (
                  <InputGroupAddon align="inline-end">
                    <Loader className="size-4 animate-spin" />
                  </InputGroupAddon>
                ) : (
                  <InputGroupAddon align="inline-end">
                    <span className="text-xs font-medium">
                      {searchResults.length > 0 ? `${searchResults.length} Results` : null}
                    </span>
                  </InputGroupAddon>
                )}
              </InputGroup>
            </Field>
          </FieldGroup>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="rounded-lg border p-1 space-y-1 max-h-44 overflow-y-auto">
              {searchResults.map((user) => (
                <Item
                  key={user.id}
                  variant="default"
                  className="cursor-pointer hover:bg-muted p-1 gap-2 flex items-center justify-center"
                  onClick={() => handleAddMember(user)}
                >
                  <ItemMedia className="flex items-center justify-center">
                    <Avatar className="size-7">
                      {/* <AvatarImage src="https://githusb.com/evilrabbit.png" /> */}
                      <AvatarFallback className="text-xs font-semibold">
                        {user.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent className="leading-none truncate">
                    <ItemTitle className="text-xs">{user.name}</ItemTitle>
                    <ItemDescription className="text-xs">@{user.username}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="text-xs px-4" />}>
            Cancel
          </DialogClose>
          <Button
            className="text-xs px-4"
            disabled={isSubmitting || !title.trim()}
            onClick={handleCreateGroup}
          >
            Create Group {isSubmitting && <Loader className="size-4 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default CreateGroupDialog;

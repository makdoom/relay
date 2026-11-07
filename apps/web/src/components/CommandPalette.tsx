import {
  CommandIcon,
  // CreditCardIcon,
  // HouseIcon,
  // LogOutIcon,
  // MoonIcon,
  // PlusIcon,
  SearchIcon,
  // SettingsIcon,
  // UserPlusIcon,
  // UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  // CommandGroup,
  CommandInput,
  // CommandItem,
  CommandList,
  // CommandSeparator,
  // CommandShortcut,
} from '@/components/ui/command';
import { Kbd, KbdGroup } from './ui/kbd';

// const groups = [
//   {
//     heading: 'Pages',
//     items: [
//       { icon: HouseIcon, label: 'Home' },
//       { icon: SettingsIcon, label: 'Settings' },
//       { icon: CreditCardIcon, label: 'Billing' },
//       { icon: UsersIcon, label: 'Team' },
//     ],
//   },
//   {
//     heading: 'Actions',
//     items: [
//       { icon: PlusIcon, label: 'New project', shortcut: '⌘N' },
//       { icon: UserPlusIcon, label: 'Invite', shortcut: '⌘I' },
//       { icon: MoonIcon, label: 'Toggle theme' },
//       { icon: LogOutIcon, label: 'Log out' },
//     ],
//   },
// ];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);

  // ⌘K on a Mac, Ctrl+K elsewhere, from anywhere on the page.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

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
      <CommandDialog onOpenChange={setOpen} open={open}>
        <Command>
          <CommandInput placeholder="Search people or conversations" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {/* {groups.map((group, index) => (
              <Fragment key={group.heading}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={group.heading}>
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <CommandItem key={item.label} onSelect={handleSelect} value={item.label}>
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                        {!!item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Fragment>
            ))} */}
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

'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { CheckIcon, SearchIcon } from 'lucide-react';
import type React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

export const Command = (props: React.ComponentProps<typeof CommandPrimitive>) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive
      className={cn(
        'bg-popover text-popover-foreground rounded-xl! p-1 flex size-full flex-col overflow-hidden',
        className
      )}
      data-slot="command"
      {...rest}
    />
  );
};

export const CommandDialog = (
  props: Omit<React.ComponentProps<typeof Dialog>, 'children'> & {
    /** The dialog's title, for screen readers. */
    title?: string;
    /** The dialog's description, for screen readers. */
    description?: string;
    className?: string;
    /** Shows the close button in the corner. */
    showCloseButton?: boolean;
    children: React.ReactNode;
  }
) => {
  const {
    title = 'Command Palette',
    description = 'Search for a command to run...',
    children,
    className,
    showCloseButton = false,
    ...rest
  } = props;

  return (
    <Dialog {...rest}>
      <DialogContent
        bottomStickOnMobile={false}
        className={cn('rounded-xl! -top-1/2 translate-y-0 overflow-hidden p-0', className)}
        showCloseButton={showCloseButton}
        size="lg"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export const CommandInput = (props: React.ComponentProps<typeof CommandPrimitive.Input>) => {
  const { className, placeholder, ...rest } = props;

  return (
    <div className="p-1 pb-0 w-full" data-slot="command-input-wrapper">
      <InputGroup className="bg-input/30 border-input/30 h-8! rounded-lg! shadow-none! *:data-[slot=input-group-addon]:ps-2! w-full">
        <CommandPrimitive.Input
          className={cn(
            'w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          data-slot="command-input"
          placeholder={placeholder}
          {...rest}
          aria-label={rest['aria-label'] ?? placeholder ?? 'Search'}
        />
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};

export const CommandList = (props: React.ComponentProps<typeof CommandPrimitive.List>) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive.List
      className={cn(
        'no-scrollbar max-h-72 scroll-py-1 outline-none overflow-y-auto overflow-x-hidden',
        className
      )}
      data-slot="command-list"
      {...rest}
    />
  );
};

export const CommandEmpty = (props: React.ComponentProps<typeof CommandPrimitive.Empty>) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive.Empty
      className={cn('py-6 text-center text-sm', className)}
      data-slot="command-empty"
      {...rest}
    />
  );
};

export const CommandGroup = (props: React.ComponentProps<typeof CommandPrimitive.Group>) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive.Group
      className={cn(
        'text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium',
        className
      )}
      data-slot="command-group"
      {...rest}
    />
  );
};

export const CommandSeparator = (
  props: React.ComponentProps<typeof CommandPrimitive.Separator>
) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive.Separator
      className={cn('bg-border -mx-1 h-px', className)}
      data-slot="command-separator"
      {...rest}
    />
  );
};

export const CommandItem = (props: React.ComponentProps<typeof CommandPrimitive.Item>) => {
  const { className, children, ...rest } = props;

  return (
    <CommandPrimitive.Item
      className={cn(
        "data-selected:bg-muted data-selected:text-foreground data-selected:*:[svg]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! [&_svg:not([class*='size-'])]:size-4 group/command-item data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-slot="command-item"
      {...rest}
    >
      {children}
      <CheckIcon
        aria-hidden="true"
        className="ms-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100"
      />
    </CommandPrimitive.Item>
  );
};

export const CommandShortcut = (props: React.ComponentProps<'span'>) => {
  const { className, ...rest } = props;

  return (
    <span
      className={cn(
        'text-muted-foreground group-data-selected/command-item:text-foreground ms-auto text-xs tracking-widest',
        className
      )}
      data-slot="command-shortcut"
      {...rest}
    />
  );
};

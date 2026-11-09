'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import type React from 'react';
import { usePreviewPortal } from '@/lib/preview-frame';
import { cn } from '@/lib/utils';

export const DropdownMenu = (props: MenuPrimitive.Root.Props) => (
  <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
);

export const DropdownMenuPortal = (props: MenuPrimitive.Portal.Props) => (
  <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
);

export const DropdownMenuTrigger = (props: MenuPrimitive.Trigger.Props) => (
  <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
);

export const DropdownMenuContent = (
  props: MenuPrimitive.Popup.Props &
    Pick<MenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>
) => {
  const {
    align = 'start',
    alignOffset = 0,
    side = 'bottom',
    sideOffset = 4,
    className,
    ...rest
  } = props;
  const boundary = usePreviewPortal() ?? undefined;

  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50 outline-none"
        collisionBoundary={boundary}
        collisionPadding={8}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          className={cn(
            'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-end-2 data-[side=inline-end]:slide-in-from-start-2 z-50 max-h-(--available-height) w-(--anchor-width) max-w-[calc(100vw-2rem)] origin-(--transform-origin) overflow-y-auto overflow-x-hidden outline-none data-closed:overflow-hidden',
            className
          )}
          data-slot="dropdown-menu-content"
          {...rest}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
};

export const DropdownMenuGroup = (props: MenuPrimitive.Group.Props) => (
  <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
);

export const DropdownMenuGroupLabel = (
  props: MenuPrimitive.GroupLabel.Props & {
    /** Indents it to line up with items that have an icon or indicator. */
    inset?: boolean;
  }
) => {
  const { className, inset, ...rest } = props;

  return (
    <MenuPrimitive.GroupLabel
      className={cn('text-muted-foreground px-1.5 py-1 text-xs data-inset:ps-7', className)}
      data-inset={inset}
      data-slot="dropdown-menu-group-label"
      {...rest}
    />
  );
};

export const DropdownMenuItem = (
  props: MenuPrimitive.Item.Props & {
    /** Indents it to line up with items that have an icon or indicator. */
    inset?: boolean;
    variant?: 'default' | 'destructive';
  }
) => {
  const { className, inset, variant = 'default', ...rest } = props;

  return (
    <MenuPrimitive.Item
      className={cn(
        "focus:bg-accent cursor-pointer focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground not-data-[variant=destructive]:hover:**:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:ps-7 [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item relative flex select-none items-center outline-hidden data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-inset={inset}
      data-slot="dropdown-menu-item"
      data-variant={variant}
      {...rest}
    />
  );
};

export const DropdownMenuSub = (props: MenuPrimitive.SubmenuRoot.Props) => (
  <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
);

export const DropdownMenuSubTrigger = (
  props: MenuPrimitive.SubmenuTrigger.Props & {
    /** Indents it to line up with items that have an icon or indicator. */
    inset?: boolean;
  }
) => {
  const { className, inset, children, ...rest } = props;

  return (
    <MenuPrimitive.SubmenuTrigger
      className={cn(
        "focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground not-data-[variant=destructive]:hover:**:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:ps-7 [&_svg:not([class*='size-'])]:size-4 flex cursor-default select-none items-center outline-hidden data-popup-open:bg-accent data-popup-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-inset={inset}
      data-slot="dropdown-menu-sub-trigger"
      {...rest}
    >
      {children}
      <ChevronRightIcon aria-hidden="true" className="ms-auto rtl:rotate-180" />
    </MenuPrimitive.SubmenuTrigger>
  );
};

export const DropdownMenuSubContent = (props: React.ComponentProps<typeof DropdownMenuContent>) => {
  const {
    align = 'start',
    alignOffset = -3,
    side = 'inline-end',
    sideOffset = 0,
    className,
    ...rest
  } = props;

  return (
    <DropdownMenuContent
      align={align}
      alignOffset={alignOffset}
      className={cn(
        'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-24 rounded-lg p-1 shadow-lg ring-1 duration-100 w-auto',
        className
      )}
      data-slot="dropdown-menu-sub-content"
      side={side}
      sideOffset={sideOffset}
      {...rest}
    />
  );
};

export const DropdownMenuCheckboxItem = (
  props: MenuPrimitive.CheckboxItem.Props & {
    /** Indents it to line up with items that have an icon or indicator. */
    inset?: boolean;
  }
) => {
  const { className, children, checked, inset, ...rest } = props;

  return (
    <MenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pe-8 ps-1.5 text-sm data-inset:ps-7 [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default select-none items-center outline-hidden data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-inset={inset}
      data-slot="dropdown-menu-checkbox-item"
      {...rest}
    >
      <span
        className="absolute inset-e-2 flex items-center justify-center pointer-events-none"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon aria-hidden="true" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
};

export const DropdownMenuRadioGroup = (props: MenuPrimitive.RadioGroup.Props) => (
  <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
);

export const DropdownMenuRadioItem = (
  props: MenuPrimitive.RadioItem.Props & {
    /** Indents it to line up with items that have an icon or indicator. */
    inset?: boolean;
  }
) => {
  const { className, children, inset, ...rest } = props;

  return (
    <MenuPrimitive.RadioItem
      className={cn(
        "focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pe-8 ps-1.5 text-sm data-inset:ps-7 [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default select-none items-center outline-hidden data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-inset={inset}
      data-slot="dropdown-menu-radio-item"
      {...rest}
    >
      <span
        className="absolute inset-e-2 flex items-center justify-center pointer-events-none"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon aria-hidden="true" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
};

export const DropdownMenuSeparator = (props: MenuPrimitive.Separator.Props) => {
  const { className, ...rest } = props;

  return (
    <MenuPrimitive.Separator
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      data-slot="dropdown-menu-separator"
      {...rest}
    />
  );
};

export const DropdownMenuShortcut = (props: React.ComponentProps<'span'>) => {
  const { className, ...rest } = props;

  return (
    <span
      className={cn(
        'text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground group-hover/dropdown-menu-item:text-accent-foreground group-data-highlighted/dropdown-menu-item:text-accent-foreground ms-auto text-xs tracking-widest',
        className
      )}
      data-slot="dropdown-menu-shortcut"
      {...rest}
    />
  );
};

export const DropdownMenuLabel = DropdownMenuGroupLabel;

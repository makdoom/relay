'use client';

import type React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const InputGroup = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    // biome-ignore lint/a11y/useSemanticElements: a <fieldset> would add form semantics and its own border and padding around a single input.
    <div
      className={cn(
        'group/input-group border-input dark:bg-input/30 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-disabled:bg-input/50 dark:has-disabled:bg-input/80 h-8 rounded-lg border transition-colors in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-3 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pe-1.5 has-[>[data-align=inline-start]]:[&>input]:ps-1.5 relative flex w-full min-w-0 items-center outline-none has-[>textarea]:h-auto',
        className
      )}
      data-slot="input-group"
      role="group"
      {...rest}
    />
  );
};

const inputGroupAddonVariants = tv({
  base: "text-muted-foreground h-auto gap-2 py-1.5 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4 flex cursor-text select-none items-center justify-center",
  defaultVariants: {
    align: 'inline-start',
  },
  variants: {
    /**
     * Where it sits in the group: `inline-start` or `inline-end` beside the
     * input, `block-start` or `block-end` above or below it.
     */
    align: {
      'block-end':
        'px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2 order-last w-full justify-start',
      'block-start':
        'px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2 order-first w-full justify-start',
      'inline-end': 'pe-2 has-[>button]:me-[-0.3rem] has-[>kbd]:me-[-0.15rem] order-last',
      'inline-start': 'ps-2 has-[>button]:ms-[-0.3rem] has-[>kbd]:ms-[-0.15rem] order-first',
    },
  },
});

export interface InputGroupAddonProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof inputGroupAddonVariants> {}

export const InputGroupAddon = (props: InputGroupAddonProps) => {
  const { className, align = 'inline-start', ...rest } = props;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: clicking the addon only forwards focus to the input, which the keyboard reaches directly.
    // biome-ignore lint/a11y/useSemanticElements: a <fieldset> would add form semantics and its own border and padding to an addon.
    <div
      className={cn(inputGroupAddonVariants({ align }), className)}
      data-align={align}
      data-slot="input-group-addon"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) {
          return;
        }
        event.currentTarget.parentElement?.querySelector('input')?.focus();
      }}
      role="group"
      {...rest}
    />
  );
};

const inputGroupButtonVariants = tv({
  base: 'gap-2 text-sm flex items-center shadow-none',
  defaultVariants: {
    size: 'xs',
  },
  variants: {
    size: {
      'icon-sm': 'size-8 p-0 has-[>svg]:p-0',
      'icon-xs': 'size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0',
      sm: 'cn-input-group-button-size-sm',
      xs: "h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
    },
  },
});

export interface InputGroupButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'size' | 'type'>,
    VariantProps<typeof inputGroupButtonVariants> {
  /** The button's type: `button` by default, so it never submits its form. */
  type?: 'button' | 'submit' | 'reset';
}

export const InputGroupButton = (props: InputGroupButtonProps) => {
  const { className, type = 'button', variant = 'ghost', size = 'xs', ...rest } = props;

  return (
    <Button
      className={cn(inputGroupButtonVariants({ size }), className)}
      data-size={size}
      data-slot="input-group-button"
      type={type}
      variant={variant}
      {...rest}
    />
  );
};

export const InputGroupText = (props: React.ComponentProps<'span'>) => {
  const { className, ...rest } = props;

  return (
    <span
      className={cn(
        "text-muted-foreground gap-2 text-sm [&_svg:not([class*='size-'])]:size-4 flex items-center [&_svg]:pointer-events-none",
        className
      )}
      data-slot="input-group-text"
      {...rest}
    />
  );
};

export const InputGroupInput = (props: React.ComponentProps<typeof Input>) => {
  const { className, ...rest } = props;

  return (
    <Input
      className={cn(
        'rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent flex-1',
        className
      )}
      data-slot="input-group-control"
      {...rest}
    />
  );
};

export const InputGroupTextarea = (props: React.ComponentProps<typeof Textarea>) => {
  const { className, ...rest } = props;

  return (
    <Textarea
      className={cn(
        'rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent flex-1 resize-none',
        className
      )}
      data-slot="input-group-control"
      {...rest}
    />
  );
};

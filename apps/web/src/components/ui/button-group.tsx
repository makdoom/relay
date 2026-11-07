'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const buttonGroupVariants = tv({
  base: "has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-e-lg flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    /**
     * Lays the buttons out in a row (`horizontal`) or a column (`vertical`),
     * their touching corners squared and borders shared.
     */
    orientation: {
      horizontal:
        '[&>[data-slot]:not(:has(~[data-slot]))]:rounded-e-lg! *:data-slot:rounded-e-none [&>[data-slot]~[data-slot]]:rounded-s-none [&>[data-slot]~[data-slot]]:border-s-0',
      vertical:
        '[&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-lg! flex-col *:data-slot:rounded-b-none [&>[data-slot]~[data-slot]]:rounded-t-none [&>[data-slot]~[data-slot]]:border-t-0',
    },
  },
});

export interface ButtonGroupProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof buttonGroupVariants> {}

export const ButtonGroup = (props: ButtonGroupProps) => {
  const { className, orientation = 'horizontal', ...rest } = props;

  return (
    // biome-ignore lint/a11y/useSemanticElements: a <fieldset> would add form semantics and its own border and padding to a row of buttons.
    <div
      className={cn(buttonGroupVariants({ orientation }), className)}
      data-orientation={orientation}
      data-slot="button-group"
      role="group"
      {...rest}
    />
  );
};

export const ButtonGroupText = (props: useRender.ComponentProps<'div'>) => {
  const { className, render, ...rest } = props;

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          "bg-muted gap-2 rounded-lg border px-2.5 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 flex items-center [&_svg]:pointer-events-none",
          className
        ),
      },
      rest
    ),
    render,
    state: {
      slot: 'button-group-text',
    },
  });
};

export const ButtonGroupSeparator = (props: React.ComponentProps<typeof Separator>) => {
  const { orientation = 'vertical', className, ...rest } = props;

  return (
    <Separator
      className={cn(
        'bg-input relative self-stretch data-horizontal:mx-px data-vertical:my-px data-vertical:h-auto data-horizontal:w-auto',
        className
      )}
      data-slot="button-group-separator"
      orientation={orientation}
      {...rest}
    />
  );
};

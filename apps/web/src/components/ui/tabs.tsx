'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';

const tabsRootClassName = cn('gap-2 group/tabs flex data-horizontal:flex-col');

export const Tabs = (props: TabsPrimitive.Root.Props) => {
  const { className, orientation = 'horizontal', ...rest } = props;

  return (
    <TabsPrimitive.Root
      className={cn(tabsRootClassName, className)}
      data-orientation={orientation}
      data-slot="tabs"
      orientation={orientation}
      {...rest}
    />
  );
};

export const tabsListVariants = tv({
  base: 'rounded-lg p-[3px] group-data-horizontal/tabs:h-8 data-[variant=line]:rounded-none group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col',
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'cn-tabs-list-variant-default bg-muted',
      line: 'cn-tabs-list-variant-line gap-1 bg-transparent',
    },
  },
});

export const TabsList = (
  props: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>
) => {
  // Focusing a tab selects it, as on the other bases (Base UI defaults to
  // manual activation: arrows only move focus, Enter or Space selects).
  const { activateOnFocus = true, className, variant = 'default', ...rest } = props;

  return (
    <TabsPrimitive.List
      activateOnFocus={activateOnFocus}
      className={cn(tabsListVariants({ variant }), className)}
      data-slot="tabs-list"
      data-variant={variant}
      {...rest}
    />
  );
};

export const TabsTrigger = (props: TabsPrimitive.Tab.Props) => {
  const { className, ...rest } = props;

  return (
    <TabsPrimitive.Tab
      className={cn(
        "gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg:not([class*='size-'])]:size-4 has-data-[icon=inline-end]:pe-1 has-data-[icon=inline-start]:ps-1 relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap text-foreground/70 transition-all hover:text-foreground focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent',
        'data-active:bg-background data-active:text-foreground  dark:data-active:bg-input/30 dark:data-active:text-foreground',
        'after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-inset-e-1 group-data-horizontal/tabs:after:-bottom-1.25 group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100',
        className
      )}
      data-slot="tabs-trigger"
      {...rest}
    />
  );
};

export const TabsContent = (props: TabsPrimitive.Panel.Props) => {
  const { className, ...rest } = props;

  return (
    <TabsPrimitive.Panel
      className={cn(
        'text-sm flex-1 outline-none',
        // The panel is a tab stop. Its ring is drawn inside it, where no
        // parent overflow clips it and no content covers it.
        'focus-visible:outline-3 focus-visible:outline-ring/50 focus-visible:outline-solid focus-visible:-outline-offset-3',
        className
      )}
      data-slot="tabs-content"
      {...rest}
    />
  );
};

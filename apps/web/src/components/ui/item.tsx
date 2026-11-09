'use client';

import type React from 'react';
import { cloneElement, type ReactElement } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const ItemGroup = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    // biome-ignore lint/a11y/useSemanticElements: Item children are not list items
    <div
      className={cn(
        'gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2 group/item-group flex w-full flex-col',
        className
      )}
      data-slot="item-group"
      role="list"
      {...rest}
    />
  );
};

export const ItemSeparator = (props: React.ComponentProps<typeof Separator>) => {
  const { className, ...rest } = props;

  return (
    <Separator
      className={cn('my-2', className)}
      data-slot="item-separator"
      orientation="horizontal"
      {...rest}
    />
  );
};

const itemVariants = tv({
  base: '[a]:hover:bg-muted rounded-lg border text-sm group/item flex w-full flex-wrap items-center outline-none transition-colors duration-100 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:transition-colors',
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
  variants: {
    size: {
      default: 'gap-2.5 px-3 py-2.5',
      sm: 'gap-2.5 px-3 py-2.5',
      xs: 'gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0',
    },
    variant: {
      default: 'border-transparent',
      muted: 'bg-muted/50 border-transparent',
      outline: 'border-border',
    },
  },
});

interface ItemProps extends React.ComponentProps<'div'>, VariantProps<typeof itemVariants> {
  render?: ReactElement<{ className?: string }>;
}

export const Item = (props: ItemProps) => {
  const { variant = 'default', size = 'default', className, render, ...rest } = props;
  const itemClassName = cn(itemVariants({ size, variant }), className);
  const itemProps = {
    className: itemClassName,
    'data-size': size,
    'data-slot': 'item',
    'data-variant': variant,
    ...rest,
  };

  if (render) {
    return cloneElement(render, {
      ...itemProps,
      className: cn(itemClassName, render.props.className),
    });
  }

  return <div {...itemProps} />;
};

const itemMediaVariants = tv({
  base: 'gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start flex shrink-0 items-center justify-center [&_svg]:pointer-events-none',
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'bg-transparent',
      icon: "[&_svg:not([class*='size-'])]:size-4",
      image:
        'size-10 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover',
    },
  },
});

interface ItemMediaProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof itemMediaVariants> {}

export const ItemMedia = (props: ItemMediaProps) => {
  const { variant = 'default', className, ...rest } = props;

  return (
    <div
      className={cn(itemMediaVariants({ variant }), className)}
      data-slot="item-media"
      data-variant={variant}
      {...rest}
    />
  );
};

export const ItemContent = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        'gap-1 group-data-[size=xs]/item:gap-0 flex flex-1 flex-col [&+[data-slot=item-content]]:flex-none',
        className
      )}
      data-slot="item-content"
      {...rest}
    />
  );
};

export const ItemTitle = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        'gap-2 text-sm leading-snug font-medium underline-offset-4 line-clamp-1 flex w-fit items-center',
        className
      )}
      data-slot="item-title"
      {...rest}
    />
  );
};

export const ItemDescription = (props: React.ComponentProps<'p'>) => {
  const { className, ...rest } = props;

  return (
    <p
      className={cn(
        'text-muted-foreground text-start text-sm leading-normal group-data-[size=xs]/item:text-xs line-clamp-2 font-normal [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
        className
      )}
      data-slot="item-description"
      {...rest}
    />
  );
};

export const ItemActions = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div className={cn('gap-2 flex items-center', className)} data-slot="item-actions" {...rest} />
  );
};

export const ItemHeader = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn('gap-2 flex basis-full items-center justify-between', className)}
      data-slot="item-header"
      {...rest}
    />
  );
};

export const ItemFooter = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn('gap-2 flex basis-full items-center justify-between', className)}
      data-slot="item-footer"
      {...rest}
    />
  );
};

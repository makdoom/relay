import type React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';

export const alertVariants = tv({
  base: "grid gap-0.5 rounded-lg border px-2.5 py-2 text-start text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pe-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 group/alert relative",
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'bg-card text-card-foreground',
      destructive:
        'text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current',
      info: [
        'bg-info/4',
        'border-info/32',
        '[&_svg]:text-info',
        '[&_[data-slot=alert-action]_[data-variant=ghost]]:hover:bg-info/10',
      ],
      success: [
        'bg-success/4',
        'border-success/32',
        '[&_svg]:text-success',
        '[&_[data-slot=alert-action]_[data-variant=ghost]]:hover:bg-success/10',
      ],
      warning: [
        'bg-warning/4',
        'border-warning/32',
        '[&_svg]:text-warning',
        '[&_[data-slot=alert-action]_[data-variant=ghost]]:hover:bg-warning/10',
      ],
    },
  },
});

interface AlertProps extends React.ComponentProps<'div'>, VariantProps<typeof alertVariants> {}

export const Alert = (props: AlertProps) => {
  const { variant, className, role = 'alert', ...rest } = props;

  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      data-slot="alert"
      data-variant={variant ?? 'default'}
      role={role}
      {...rest}
    />
  );
};

export const AlertTitle = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        'font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground',
        className
      )}
      data-slot="alert-title"
      {...rest}
    />
  );
};

export const AlertDescription = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        'text-muted-foreground text-sm text-balance md:text-pretty [&_p:not(:last-child)]:mb-4 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground',
        className
      )}
      data-slot="alert-description"
      {...rest}
    />
  );
};

export const AlertAction = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div className={cn('absolute top-2 inset-e-2', className)} data-slot="alert-action" {...rest} />
  );
};

import type React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn('bg-muted rounded-md animate-pulse', className)}
      data-slot="skeleton"
      {...rest}
    />
  );
};

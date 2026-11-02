import { Loader } from 'lucide-react';
import type React from 'react';
import { cn } from '@/lib/utils';

export const Spinner = (props: React.ComponentProps<'svg'>) => {
  const { 'aria-label': ariaLabel, className, ...rest } = props;

  return (
    <Loader
      aria-label={ariaLabel ?? 'Loading'}
      className={cn('size-4 animate-spin', className)}
      data-slot="spinner"
      role="status"
      {...rest}
    />
  );
};

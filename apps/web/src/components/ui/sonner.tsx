'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import type React from 'react';
import { useSyncExternalStore } from 'react';
import { Toaster as Sonner, toast as sonnerToast, type ToasterProps } from 'sonner';
import { cn } from '@/lib/utils';

export const toast = sonnerToast;

export const createToaster = () => toast;

type Theme = NonNullable<ToasterProps['theme']>;

/** The page's theme: a `dark` or `light` class on <html>, else its `color-scheme`. */
const readPageTheme = (): Theme => {
  const root = document.documentElement;
  if (root.classList.contains('dark')) {
    return 'dark';
  }
  if (root.classList.contains('light')) {
    return 'light';
  }
  const scheme = root.style.colorScheme;

  return scheme === 'dark' || scheme === 'light' ? scheme : 'system';
};

const readServerTheme = (): Theme => 'system';

const watchPageTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributeFilter: ['class', 'style'],
    attributes: true,
  });

  return () => observer.disconnect();
};

export const Toaster = (props: ToasterProps) => {
  const { className, theme, ...rest } = props;
  // Follows the page's theme, not only the system's: a dark page in a light
  // system would otherwise get light toasts with unreadable text.
  const pageTheme = useSyncExternalStore(watchPageTheme, readPageTheme, readServerTheme);

  return (
    <Sonner
      className={cn('toaster group', className)}
      data-slot="toaster"
      icons={{
        error: <OctagonXIcon aria-hidden="true" className="size-4" />,
        info: <InfoIcon aria-hidden="true" className="size-4" />,
        loading: <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />,
        success: <CircleCheckIcon aria-hidden="true" className="size-4" />,
        warning: <TriangleAlertIcon aria-hidden="true" className="size-4" />,
      }}
      style={
        {
          '--border-radius': 'var(--radius)',
          '--normal-bg': 'var(--popover)',
          '--normal-border': 'var(--border)',
          '--normal-text': 'var(--popover-foreground)',
        } as React.CSSProperties
      }
      theme={theme ?? pageTheme}
      toastOptions={{
        classNames: {
          toast: 'rounded-2xl',
        },
      }}
      {...rest}
    />
  );
};

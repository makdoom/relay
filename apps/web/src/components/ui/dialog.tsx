'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import type React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { Button } from '@/components/ui/button';
import { usePreviewFrame, usePreviewPortal } from '@/lib/preview-frame';
import { cn } from '@/lib/utils';

export const Dialog = (props: DialogPrimitive.Root.Props) => (
  <DialogPrimitive.Root data-slot="dialog" {...props} />
);

export const DialogTrigger = (props: DialogPrimitive.Trigger.Props) => (
  <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
);

export const DialogPortal = (props: DialogPrimitive.Portal.Props) => {
  const { container, ...rest } = props;
  const preview = usePreviewPortal();

  return (
    <DialogPrimitive.Portal
      container={container ?? preview ?? undefined}
      data-slot="dialog-portal"
      {...rest}
    />
  );
};

export const DialogClose = (props: DialogPrimitive.Close.Props) => (
  <DialogPrimitive.Close data-slot="dialog-close" {...props} />
);

export const dialogOverlayVariants = tv({
  base: 'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50',
});

export const DialogOverlay = (props: DialogPrimitive.Backdrop.Props) => {
  const { className, ...rest } = props;
  const inPreview = usePreviewFrame();

  return (
    <DialogPrimitive.Backdrop
      className={cn(dialogOverlayVariants(), inPreview && 'absolute!', className)}
      data-slot="dialog-overlay"
      {...rest}
    />
  );
};

export const dialogContentVariants = tv({
  base: [
    'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid gap-4 rounded-xl p-4 text-sm ring-1 duration-100 sm:max-w-sm relative z-50 row-start-2 min-h-min w-full max-w-full outline-none',
  ],
  defaultVariants: {
    size: 'md',
  },
  variants: {
    bottomStickOnMobile: {
      true: [
        'max-sm:max-h-[calc(100svh-3rem)]',
        'max-sm:max-w-none',
        'max-sm:rounded-none max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-t max-sm:border-b-0',
        'max-sm:opacity-[calc(1-min(var(--nested-dialogs),1))]',
        'max-sm:data-[state=closed]:slide-out-to-bottom-5 max-sm:data-[state=open]:slide-in-from-bottom-5',
        'max-sm:data-[state=closed]:zoom-out-100 max-sm:data-[state=open]:zoom-in-100',
      ],
    },
    // From `sm:` up, as the skin's own `sm:max-w-sm`, so a size still wins
    // once the skin is inlined into the installed file (and a `sm:max-w-*`
    // in `className` still beats the size).
    size: {
      '2xl': ['sm:max-w-3xl'],
      '3xl': ['sm:max-w-4xl'],
      '4xl': ['sm:max-w-5xl'],
      '5xl': ['sm:max-w-6xl'],
      '6xl': ['sm:max-w-7xl'],
      fullscreen: ['size-full max-w-none sm:max-w-none'],
      lg: ['sm:max-w-xl'],
      md: ['sm:max-w-lg'],
      sm: ['sm:max-w-md'],
      xl: ['sm:max-w-2xl'],
    },
  },
});

interface DialogContentProps
  extends DialogPrimitive.Popup.Props,
    VariantProps<typeof dialogContentVariants> {
  /**
   * Stick the dialog to the bottom of the screen on mobile
   *
   * @default true
   */
  bottomStickOnMobile?: boolean;
  /**
   * Class names on the positioner (the viewport-fixed wrapper).
   */
  positionerClassName?: string;
  /**
   * Show close button at the top right corner
   *
   * @default true
   */
  showCloseButton?: boolean;
}

export const DialogContent = (props: DialogContentProps) => {
  const {
    showCloseButton = true,
    bottomStickOnMobile = true,
    positionerClassName,
    size = 'md',
    className,
    children,
    ...rest
  } = props;
  const inPreview = usePreviewFrame();

  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        className={cn(
          'z-50 grid grid-rows-[1fr_auto_1fr] justify-items-center p-4',
          inPreview ? 'absolute inset-0 h-full w-full' : 'fixed inset-0 h-svh w-screen',
          bottomStickOnMobile && 'max-sm:grid-rows-[1fr_auto] max-sm:p-0 max-sm:pt-12',
          positionerClassName
        )}
        data-slot="dialog-positioner"
      >
        <DialogPrimitive.Popup
          className={cn(dialogContentVariants({ bottomStickOnMobile, size }), className)}
          data-slot="dialog-content"
          {...rest}
        >
          {children}
          {showCloseButton ? (
            <DialogClose
              render={
                <Button className="absolute top-2 inset-e-2" size="icon-sm" variant="ghost" />
              }
            >
              <XIcon aria-hidden="true" />
              <span className="sr-only">Close</span>
            </DialogClose>
          ) : null}
        </DialogPrimitive.Popup>
      </div>
    </DialogPortal>
  );
};

interface DialogHeaderProps extends React.ComponentProps<'div'> {
  /**
   * The description of the dialog
   */
  description?: string;
  /**
   * The title of the dialog
   */
  title?: string;
}

export const DialogHeader = (props: DialogHeaderProps) => {
  const { className, title, description, children, ...rest } = props;

  return (
    <div className={cn('gap-2 flex flex-col', className)} data-slot="dialog-header" {...rest}>
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      {description ? <DialogDescription>{description}</DialogDescription> : null}
      {!title && typeof children === 'string' ? <DialogTitle>{children}</DialogTitle> : children}
    </div>
  );
};

export const DialogTitle = (props: DialogPrimitive.Title.Props) => {
  const { className, ...rest } = props;

  return (
    <DialogPrimitive.Title
      className={cn('text-base leading-none font-medium font-heading', className)}
      data-slot="dialog-title"
      {...rest}
    />
  );
};

export const DialogDescription = (props: DialogPrimitive.Description.Props) => {
  const { className, ...rest } = props;

  return (
    <DialogPrimitive.Description
      className={cn(
        'text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3',
        className
      )}
      data-slot="dialog-description"
      {...rest}
    />
  );
};

interface DialogFooterProps extends React.ComponentProps<'div'> {
  /**
   * Show a close button in the footer
   *
   * @default false
   */
  showCloseButton?: boolean;
}

export const DialogFooter = (props: DialogFooterProps) => {
  const { className, showCloseButton = false, children, ...rest } = props;

  return (
    <div
      className={cn(
        'bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      data-slot="dialog-footer"
      {...rest}
    >
      {children}
      {showCloseButton ? (
        <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
      ) : null}
    </div>
  );
};

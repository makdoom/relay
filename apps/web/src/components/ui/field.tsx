'use client';

import { Field as FieldPrimitive } from '@base-ui/react/field';
import type React from 'react';
import { useMemo } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const Label = (props: React.ComponentProps<'label'>) => {
  const { className, ...rest } = props;

  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: association is via htmlFor or wrapping at the call site
    <label
      className={cn(
        'gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex select-none items-center peer-disabled:cursor-not-allowed group-data-[disabled=true]:pointer-events-none',
        className
      )}
      data-slot="label"
      {...rest}
    />
  );
};

export const FieldSet = (props: React.ComponentProps<'fieldset'>) => {
  const { className, ...rest } = props;

  return (
    <fieldset
      className={cn(
        'gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3 flex flex-col',
        className
      )}
      data-slot="field-set"
      {...rest}
    />
  );
};

export const FieldLegend = (
  props: React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }
) => {
  const { className, variant = 'legend', ...rest } = props;

  return (
    <legend
      className={cn(
        'mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base',
        className
      )}
      data-slot="field-legend"
      data-variant={variant}
      {...rest}
    />
  );
};

export const FieldGroup = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        'gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4 group/field-group @container/field-group flex w-full flex-col',
        className
      )}
      data-slot="field-group"
      {...rest}
    />
  );
};

const fieldVariants = tv({
  base: 'data-[invalid=true]:text-destructive gap-2 group/field flex w-full',
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    /**
     * Stacks the label over the control (`vertical`), puts them side by side
     * (`horizontal`), or side by side on wide containers only (`responsive`).
     */
    orientation: {
      horizontal:
        'cn-field-orientation-horizontal flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      responsive:
        'cn-field-orientation-responsive @md/field-group:flex-row flex-col @md/field-group:items-center *:w-full @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      vertical: 'cn-field-orientation-vertical flex-col *:w-full [&>.sr-only]:w-auto',
    },
  },
});

export interface FieldProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof fieldVariants> {
  /**
   * Marks the field invalid, as a form library reports it: the field turns
   * destructive and its Base UI controls (Input, Select, Checkbox, Switch…)
   * get `aria-invalid`, with nothing to add on them.
   */
  invalid?: boolean;
}

export const Field = (props: FieldProps) => {
  const { className, invalid, orientation = 'vertical', ...rest } = props;
  const fieldProps = {
    className: cn(fieldVariants({ orientation }), className),
    'data-orientation': orientation,
    'data-slot': 'field',
    role: 'group',
    ...rest,
  };

  // Base UI's field carries the state to the controls inside; without
  // `invalid` there's nothing to carry, so a plain group.
  if (invalid === undefined) {
    return <div {...fieldProps} />;
  }
  return (
    <FieldPrimitive.Root
      {...fieldProps}
      data-invalid={invalid ? 'true' : undefined}
      invalid={invalid}
    />
  );
};

export const FieldContent = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn('gap-0.5 group/field-content flex flex-1 flex-col leading-snug', className)}
      data-slot="field-content"
      {...rest}
    />
  );
};

export const FieldLabel = (props: React.ComponentProps<typeof Label>) => {
  const { className, ...rest } = props;

  return (
    <Label
      className={cn(
        'has-data-checked:bg-primary/5 has-data-checked:border-primary/30 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10 gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 *:data-[slot=field]:p-2.5 group/field-label peer/field-label flex w-fit',
        'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col',
        className
      )}
      data-slot="field-label"
      {...rest}
    />
  );
};

export const FieldTitle = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        'gap-2 leading-snug text-sm font-medium group-data-[disabled=true]/field:opacity-50 flex w-fit items-center',
        className
      )}
      data-slot="field-label"
      {...rest}
    />
  );
};

export const FieldDescription = (props: React.ComponentProps<'p'>) => {
  const { className, ...rest } = props;

  return (
    <p
      className={cn(
        'text-muted-foreground text-start text-sm [[data-variant=legend]+&]:-mt-1.5 font-normal leading-normal group-has-data-horizontal/field:text-balance',
        'nth-last-2:-mt-1 last:mt-0',
        '[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
        className
      )}
      data-slot="field-description"
      {...rest}
    />
  );
};

export const FieldSeparator = (
  props: React.ComponentProps<'div'> & {
    children?: React.ReactNode;
  }
) => {
  const { children, className, ...rest } = props;

  return (
    <div
      className={cn(
        '-my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2 relative',
        className
      )}
      data-content={!!children}
      data-slot="field-separator"
      {...rest}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children ? (
        <span
          className="text-muted-foreground px-2 relative mx-auto block w-fit bg-background"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      ) : null}
    </div>
  );
};

export const FieldError = (
  props: React.ComponentProps<'div'> & {
    /**
     * Errors to show, such as a form library's (`{ message }` each): one as
     * text, several as a list, repeats once.
     */
    errors?: Array<{ message?: string } | undefined>;
  }
) => {
  const { className, children, errors, ...rest } = props;

  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ms-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error) => error?.message && <li key={error.message}>{error.message}</li>
        )}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      className={cn('text-destructive text-sm font-normal', className)}
      data-slot="field-error"
      role="alert"
      {...rest}
    >
      {content}
    </div>
  );
};

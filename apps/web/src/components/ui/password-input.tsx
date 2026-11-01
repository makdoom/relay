'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { type ComponentProps, createContext, type ReactNode, useContext, useState } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

interface PasswordStore {
  autoComplete?: string;
  defaultValue?: string;
  disabled: boolean;
  invalid: boolean;
  setVisible: (next: boolean) => void;
  visible: boolean;
}

const PasswordContext = createContext<PasswordStore | null>(null);

export const usePasswordInput = () => {
  const store = useContext(PasswordContext);
  if (!store) {
    throw new Error('Password input parts must be inside PasswordInput.');
  }
  return store;
};

interface PasswordInputProps extends ComponentProps<'div'> {
  autoComplete?: string;
  defaultValue?: string;
  defaultVisible?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onVisibilityChange?: (details: { visible: boolean }) => void;
  size?: 'sm' | 'md' | 'lg';
  visible?: boolean;
}

export const PasswordInput = (props: PasswordInputProps) => {
  const {
    autoComplete,
    children,
    className,
    defaultValue,
    defaultVisible = false,
    disabled = false,
    invalid = false,
    onVisibilityChange,
    size = 'md',
    visible,
    ...rest
  } = props;
  const [uncontrolled, setUncontrolled] = useState(defaultVisible);
  const shown = visible ?? uncontrolled;
  const setVisible = (next: boolean) => {
    if (visible === undefined) {
      setUncontrolled(next);
    }
    onVisibilityChange?.({ visible: next });
  };

  return (
    <PasswordContext.Provider
      value={{
        autoComplete,
        defaultValue,
        disabled,
        invalid,
        setVisible,
        visible: shown,
      }}
    >
      <div
        className={cn(
          'group/password-input',
          'w-full',
          'flex flex-col items-start gap-2',
          className
        )}
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        data-size={size}
        data-slot="password-input"
        {...rest}
      >
        {children}
      </div>
    </PasswordContext.Provider>
  );
};

export const PasswordInputGroup = (props: ComponentProps<typeof InputGroup>) => {
  const { className, ...rest } = props;
  const store = usePasswordInput();

  return (
    <InputGroup
      className={cn(
        'in-data-[size=lg]:h-9 in-data-[size=sm]:h-7',
        'data-disabled:pointer-events-none data-disabled:opacity-64',
        'has-[[data-slot=password-input-input]:focus-visible]:border-ring has-[[data-slot=password-input-input]:focus-visible]:ring-ring/50 has-[[data-slot=password-input-input]:focus-visible]:ring-3',
        className
      )}
      data-disabled={store.disabled || undefined}
      data-invalid={store.invalid || undefined}
      data-slot="password-input-control"
      {...rest}
    />
  );
};

export const PasswordInputInput = (props: ComponentProps<typeof InputGroupInput>) => {
  const { defaultValue, type: _type, ...rest } = props;
  const store = usePasswordInput();

  return (
    <InputGroupInput
      {...rest}
      aria-invalid={store.invalid || undefined}
      autoComplete={rest.autoComplete ?? store.autoComplete}
      data-slot="input-group-control"
      defaultValue={rest.value === undefined ? (defaultValue ?? store.defaultValue) : undefined}
      disabled={rest.disabled ?? store.disabled}
      type={store.visible ? 'text' : 'password'}
    />
  );
};

export const PasswordInputTrigger = (props: ComponentProps<typeof InputGroupButton>) => {
  const { children, onClick, ...rest } = props;
  const store = usePasswordInput();
  const handleClick: NonNullable<ComponentProps<typeof InputGroupButton>['onClick']> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || store.disabled) {
      return;
    }
    store.setVisible(!store.visible);
  };

  return (
    <InputGroupAddon align="inline-end">
      <InputGroupButton
        size="icon-xs"
        variant="ghost"
        {...rest}
        aria-label={store.visible ? 'Hide password' : 'Show password'}
        aria-pressed={store.visible}
        data-slot="password-input-visibility-trigger"
        onClick={handleClick}
      >
        {children ?? <PasswordInputIndicator />}
      </InputGroupButton>
    </InputGroupAddon>
  );
};

export const PasswordInputIndicator = (props: {
  children?: ReactNode;
  className?: string;
  fallback?: ReactNode;
}) => {
  const { children, className, fallback } = props;
  const store = usePasswordInput();

  return (
    <span className={cn('contents', className)} data-slot="password-input-indicator">
      {store.visible
        ? (children ?? <EyeIcon aria-hidden />)
        : (fallback ?? <EyeOffIcon aria-hidden />)}
    </span>
  );
};

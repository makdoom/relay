import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import z from 'zod';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  PasswordInput,
  PasswordInputGroup,
  PasswordInputInput,
  PasswordInputTrigger,
} from '@/components/ui/password-input';
import { toast } from '@/components/ui/sonner';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  email: z.email('Please enter a valid email').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      password: '',
      email: '',
    },
    resolver: zodResolver(formSchema),
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { email, password } = values;

    try {
      if (!email) return toast.error('Email is required');
      if (!password) return toast.error('Password is required');

      await login({ identifier: email, password });
      navigate('/chat', { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message || 'Unable to sign in, Please check your credentials.'
          : ''
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  return (
    <div className="flex items-center flex-col justify-center h-screen w-full ">
      <div className="flex flex-col items-center justify-center w-full max-w-sm space-y-4">
        <div className="mb-6">
          <Logo />
        </div>

        <div className="text-center flex flex-col space-y-1 mb-6">
          <h2 className="text-xl">Sign in to Relay</h2>
          <p className="text-muted-foreground text-sm">
            Enter your credentials to access your account.
          </p>
        </div>

        <form className="w-full max-w-sm" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    {...field}
                    className="h-9"
                    id="email"
                    placeholder="john@mail.com"
                    autoFocus
                    disabled={isSubmitting}
                  />
                  <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <PasswordInput size="lg">
                    <PasswordInputGroup>
                      <PasswordInputInput
                        id="password"
                        {...field}
                        placeholder="*********"
                        disabled={isSubmitting}
                      />
                      <PasswordInputTrigger />
                    </PasswordInputGroup>
                  </PasswordInput>
                  <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
            <Button
              className="h-9 w-full font-medium text-sm"
              type="submit"
              disabled={isSubmitting}
            >
              Sign In
              {isSubmitting && <Spinner />}
            </Button>
          </FieldGroup>
        </form>

        <div className="w-full">
          <p className="text-center text-muted-foreground text-sm">
            Don't have an account ?{' '}
            <a className="hover:underline text-foreground" href="/register">
              Create One
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

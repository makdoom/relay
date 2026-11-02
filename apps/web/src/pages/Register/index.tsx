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
  fullName: z.string().min(2, 'Name is required'),
  email: z.email('Please enter a valid email').min(1, 'Email is required'),
  username: z.string().min(2, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      username: '',
      password: '',
    },
    resolver: zodResolver(formSchema),
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { fullName, username, email, password } = values;

    try {
      if (!fullName) return toast.error('Name is required');
      if (!username) return toast.error('Username is required');
      if (!email) return toast.error('Email is required');
      if (!password) return toast.error('Password is required');

      await register({
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        name: fullName.trim(),
      });

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
          <h2 className="text-xl">Create your Relay account</h2>
          <p className="text-muted-foreground text-sm">
            A few details and you're ready to connect.
          </p>
        </div>

        <form className="w-full max-w-sm" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            <Controller
              control={form.control}
              name="fullName"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="full-name">Full name</FieldLabel>
                  <Input
                    {...field}
                    className="h-9"
                    id="full-name"
                    placeholder="John Doe"
                    autoFocus
                    disabled={isSubmitting}
                  />
                  <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="username"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    {...field}
                    className="h-9"
                    id="username"
                    placeholder="@john"
                    disabled={isSubmitting}
                  />
                  <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
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
            <Button className="h-9 w-full font-medium text-sm" type="submit">
              Create Account
              {isSubmitting && <Spinner />}
            </Button>
          </FieldGroup>
        </form>

        <div className="w-full">
          <p className="text-center text-muted-foreground text-sm">
            Already have an account ?{' '}
            <a className="hover:underline text-foreground" href="/login">
              Signin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

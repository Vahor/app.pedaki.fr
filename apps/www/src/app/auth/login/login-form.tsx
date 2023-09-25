'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { UserModel } from '@pedaki/api/models/user.model.js';
import { wrapWithLoading } from '@pedaki/common/utils/wrap-with-loading.js';
import { Button } from '@pedaki/design/ui/button.js';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@pedaki/design/ui/form.js';
import { IconGoogle, IconSpinner } from '@pedaki/design/ui/icons';
import { Input } from '@pedaki/design/ui/input.js';
import { signIn } from 'next-auth/react';
import Link from 'next/link.js';
import React from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

const LoginFormSchema = UserModel.pick({ email: true, password: true });
type LoginFormValues = z.infer<typeof LoginFormSchema>;

const LoginForm = () => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    mode: 'onChange',
    defaultValues: {
      // TODO: remove this
      email: 'test@email.com',
      password: 'test123456789',
    },
  });
  const { isSubmitting } = form.formState;
  const [providerLoading, setProviderLoading] = React.useState(false);

  const isLoading = isSubmitting || providerLoading;

  function onSubmit(values: LoginFormValues) {
    return wrapWithLoading(
      async () => {
        await signIn('credentials', {
          email: values.email,
          password: values.password,
          callbackUrl: '/',
        });
      },
      {
        loadingProps: null,
        successProps: null,
        errorProps: error => ({
          title: error.message,
        }),
        throwOnError: false,
      },
    );
  }

  async function providerLogin(provider: string) {
    try {
      setProviderLoading(true);
      await wrapWithLoading(
        async () => {
          await signIn(provider, { callbackUrl: '/' });
        },
        {
          loadingProps: null,
          successProps: null,
          errorProps: error => ({
            title: error.message,
          }),
          throwOnError: false,
        },
      );
    } finally {
      setProviderLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    placeholder="********"
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-2">
            <Button disabled={isLoading} className="mt-2" variant="neutral">
              {isLoading && <IconSpinner className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          </div>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-primary px-2 text-secondary">OU</span>
          </div>
        </div>
        <div className="flex flex-row space-x-2">
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            onClick={() => providerLogin('google')}
            className="flex-1"
          >
            {isLoading ? (
              <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <IconGoogle className="mr-2 h-4 w-4" />
            )}{' '}
            Google
          </Button>
        </div>
        <div className="text-center text-sm">
          <span className="text-secondary">Vous n&apos;avez pas de compte ?</span>{' '}
          <Link href="/auth/register" className="text-orange">
            S&apos;inscrire
          </Link>
        </div>
      </Form>
    </div>
  );
};

export default LoginForm;

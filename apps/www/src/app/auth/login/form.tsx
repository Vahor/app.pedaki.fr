'use client';

import { Button } from '@pedaki/design/ui/button';
import { IconGoogle, IconSpinner } from '@pedaki/design/ui/icons';
import { signIn } from 'next-auth/react';
import React, { useTransition } from 'react';

const LoginForm = () => {
  const [pending, startTransition] = useTransition();

  function providerLogin(provider: string) {
    return startTransition(() => void signIn(provider, { callbackUrl: '/' }));
  }

  return (
    <div>
      <Button
        variant="outline"
        type="button"
        disabled={pending}
        onClick={() => providerLogin('google')}
        className="flex-1"
      >
        {pending ? (
          <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <IconGoogle className="mr-2 h-4 w-4" />
        )}{' '}
        Google
      </Button>
    </div>
  );
};

export default LoginForm;

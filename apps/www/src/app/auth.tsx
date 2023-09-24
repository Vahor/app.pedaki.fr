'use client';

import { Button } from '@pedaki/design/ui/button';
import { signIn, signOut } from 'next-auth/react';

export const LoginButton = () => {
  return <Button onClick={() => void signIn()}>Sign in</Button>;
};

export const LogoutButton = () => {
  return <Button onClick={() => void signOut()}>Sign Out</Button>;
};

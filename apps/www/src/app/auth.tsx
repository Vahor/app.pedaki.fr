'use client';

import { signIn, signOut } from 'next-auth/react';

export const LoginButton = () => {
  return <button onClick={() => void signIn()}>Sign in</button>;
};

export const LogoutButton = () => {
  return <button onClick={() => void signOut()}>Sign Out</button>;
};

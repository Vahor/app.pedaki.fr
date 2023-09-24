'use client';

import { Button } from '@pedaki/design/ui/button';
import { signIn, signOut, useSession } from 'next-auth/react';
import {api} from "~/server/api/clients/client";
import {wrapWithLoading} from "@pedaki/common/utils/wrap-with-loading";

export const LoginButton = () => {
  return <Button onClick={() => void signIn()}>Sign in</Button>;
};

export const LogoutButton = () => {
  return <Button onClick={() => void signOut()}>Sign Out</Button>;
};


export const DeleteAccountButton = () => {
  const deleteAccountMutation = api.auth.debug_delete_account.useMutation();
  const { data: session } = useSession();


  const handleDeleteAccount = async () => {
    return wrapWithLoading(() => deleteAccountMutation.mutateAsync({
      id: session!.user.id,
    }), {
      successProps: () => ({
        title: 'Account deleted',
      }),
    }).then(() => {
        signOut();
    });
  }

  return <Button onClick={handleDeleteAccount}>Delete Account</Button>;
}
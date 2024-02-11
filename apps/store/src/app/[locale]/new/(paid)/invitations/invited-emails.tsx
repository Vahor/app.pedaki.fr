'use client';

import wait from '@pedaki/common/utils/wait';
import { wrapWithLoading } from '@pedaki/common/utils/wrap-with-loading';
import { Avatar, AvatarFallback } from '@pedaki/design/ui/avatar';
import { Button } from '@pedaki/design/ui/button';
import { Card } from '@pedaki/design/ui/card';
import { IconMailSearch, IconX } from '@pedaki/design/ui/icons';
import IconSpinner from '@pedaki/design/ui/icons/IconSpinner';
import { api } from '~/server/api/clients/client.ts';
import { useWorkspaceInvitationStore } from '~/store/workspace-invitation.store.ts';
import React, { useEffect } from 'react';
import Balancer from 'react-wrap-balancer';

interface InvitedEmailsProps {
  initialEmails: { email: string }[];
  token: string;
}

const twoLettersFromEmail = (email: string) => {
  const [username] = email.split('@', 1);
  const usernameParts = username!.split('.', 2).filter(part => part.length > 0);
  const [firstPart, secondPart] = usernameParts;
  if (!firstPart && !secondPart) return '??';
  if (!secondPart) {
    return firstPart!.slice(0, 2).toUpperCase();
  }

  return `${firstPart!.slice(0, 1).toUpperCase()}${secondPart.slice(0, 1).toUpperCase()}`;
};

export function InvitedEmails({ initialEmails, token }: Readonly<InvitedEmailsProps>) {
  const emails = useWorkspaceInvitationStore(state => state.emails);
  const setEmails = useWorkspaceInvitationStore(state => state.setEmails);

  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails, setEmails]);

  if (!emails || emails.length === 0)
    return (
      <div className="relative mt-6 flex h-full flex-col items-center gap-2">
        <div className="z-1 rounded-md border bg-white">
          <IconMailSearch className="h-12 w-12 p-3 text-sub" />
        </div>
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-title-6 font-bold">Aucun collaborateur invité</h1>
          <Balancer className="max-w-screen-sm text-p-sm text-sub">
            Utilisez le formulaire ci-dessus pour inviter des collaborateurs.
          </Balancer>
        </div>
      </div>
    );

  return (
    <div>
      <h2 className="mb-4 text-label-sm text-main">Collaborateurs invités</h2>
      <ul className="space-y-2">
        {emails.map(info => (
          <li key={info.email}>
            <Card className="flex items-center gap-2 bg-white p-3 flex-row">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-sm select-none bg-surface font-medium text-white">
                  {twoLettersFromEmail(info.email)}
                </AvatarFallback>
              </Avatar>
              <span
                className="max-w-[38ch] overflow-hidden text-ellipsis text-p-sm text-sub"
                title={info.email}
              >
                {info.email}
              </span>
              <div className="flex-1"></div>
              <RemoveInvitedEmailButton email={info.email} token={token} />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

const RemoveInvitedEmailButton = ({ email, token }: { email: string; token: string }) => {
  const removeEmail = useWorkspaceInvitationStore(state => state.removeEmail);

  const deleteInvitationMutation = api.workspace.invitation.delete.useMutation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleRemoveEmail = async (email: string) => {
    setIsSubmitting(true);
    return wrapWithLoading(
      () =>
        wait(
          deleteInvitationMutation.mutateAsync({
            email,
            token,
          }),
          200,
        ),
      {
        loadingProps: null,
        successProps: {
          title: '🎉 Invitation supprimée avec succès',
        },
        errorProps: _error => {
          const title = "Une erreur est survenue lors de la suppression de l'invitation";
          return {
            title,
          };
        },
        throwOnError: true,
      },
    )
      .then(() => {
        removeEmail(email);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <Button
      size="sm"
      variant="filled-error"
      onClick={() => handleRemoveEmail(email)}
      disabled={isSubmitting}
    >
      {isSubmitting && <IconSpinner className="mr-2 h-4 w-4 animate-spin" />}
      <span className="hidden md:inline">Retirer</span>
      <IconX className="h-4 w-4 md:hidden" />
    </Button>
  );
};

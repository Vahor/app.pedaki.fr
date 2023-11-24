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
  initialEmails: { name: string; email: string }[];
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
      <div className="relative flex h-full flex-col items-center">
        <div className="relative -z-10 -mb-28 flex h-[300px] w-full items-center justify-center">
          <div
            className="absolute -z-10 h-full w-full bgi-grid-gray-500"
            style={{
              maskImage: 'radial-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0))',
              WebkitMaskImage: 'radial-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0))',
              backgroundPositionY: '-16px',
              backgroundPositionX: '-16px',
            }}
          ></div>
          <div className="z-1 rounded-md border bg-white">
            <IconMailSearch className="h-12 w-12 p-3 text-grayA-11" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Aucun collaborateur invité</h1>
        <Balancer className="mb-8 mt-4 max-w-screen-sm text-secondary">
          Utilisez le formulaire ci-contre pour inviter des collaborateurs.
        </Balancer>
      </div>
    );

  return (
    <div>
      <ul className="space-y-2">
        {emails.map(info => (
          <li key={info.email}>
            <Card className="flex items-center gap-2 bg-white p-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gray-12 text-sm font-medium text-white">
                  {twoLettersFromEmail(info.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className="max-w-[40ch] overflow-hidden text-ellipsis text-base text-secondary"
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
      variant="red"
      onClick={() => handleRemoveEmail(email)}
      disabled={isSubmitting}
    >
      {isSubmitting && <IconSpinner className="mr-2 h-4 w-4 animate-spin" />}
      <span className="hidden md:inline">Supprimer</span>
      <IconX className="h-4 w-4 md:hidden" />
    </Button>
  );
};

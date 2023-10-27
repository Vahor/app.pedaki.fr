import { IconCalendarX, IconX } from '@pedaki/design/ui/icons';
import { CheckStatusBanner } from '~/app/new/(paid)/invitations/check-status-banner.tsx';
import { InviteForm } from '~/app/new/(paid)/invitations/invite-form.tsx';
import { InvitedEmails } from '~/app/new/(paid)/invitations/invited-emails.tsx';
import { parseToken } from '~/app/new/(paid)/invitations/parse-token.ts';
import StatusWrapper from '~/app/status-wrapper.tsx';
import { api } from '~/server/api/clients/server.ts';
import React from 'react';

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const token = searchParams.token;
  const data = parseToken(token);

  // TODO: faire les textes (trads)
  if (data.status === 'invalid') {
    return (
      <StatusWrapper
        titleKey="Le token est invalide"
        descriptionKey="Le token est invalide."
        icon={IconX}
        iconClassName="text-red-9"
      />
    );
  }

  if (data.status === 'expired') {
    return (
      <StatusWrapper
        titleKey="Le token est expiré"
        descriptionKey="Le token est expiré."
        icon={IconCalendarX}
        iconClassName="text-red-9"
      />
    );
  }

  const initialEmails = await api.workspace.invitation.getMany.query({
    token: token!,
  });

  if (data.status === 'valid') {
    return (
      <>
        <h1 className="text-2xl font-bold">Inviter des collaborateurs</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <InviteForm rawToken={token!} />
            <CheckStatusBanner healthUrl={data.workspaceHealthUrl} baseUrl={data.workspaceUrl} />
          </div>
          <div className="md:mt-8">
            <InvitedEmails initialEmails={initialEmails.emails} token={token!} />
          </div>
        </div>
      </>
    );
  }

  throw new Error('Unhandled status');
}

import { IconCalendarX, IconX } from '@pedaki/design/ui/icons';
import { Separator } from '@pedaki/design/ui/separator';
import { CheckStatusToast } from '~/app/new/(paid)/invitations/check-status-toast.tsx';
import { InviteForm } from '~/app/new/(paid)/invitations/invite-form.tsx';
import { InvitedEmails } from '~/app/new/(paid)/invitations/invited-emails.tsx';
import { parseToken } from '~/app/new/(paid)/invitations/parse-token.ts';
import StatusWrapper from '~/app/status-wrapper.tsx';
import PageHeader from '~/components/page-header';
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
        // TODO: ne pas parler de token, un moldu ne sait pas ce que c'est
        titleKey="Le token est invalide"
        icon={IconX}
        iconClassName="text-state-error"
      />
    );
  }

  if (data.status === 'expired') {
    return (
      <StatusWrapper
        // TODO: ne pas parler de token, un moldu ne sait pas ce que c'est
        titleKey="Le token est expiré"
        icon={IconCalendarX}
        iconClassName="text-state-error"
      />
    );
  }

  const { invitations } = await api.workspace.invitation.getMany.query({
    token: token!,
  });

  if (data.status === 'valid') {
    return (
      <>
        <CheckStatusToast subdomain={data.subdomain} baseUrl={data.workspaceUrl} />
        <div className="mx-auto mt-16 flex max-w-screen-sm flex-col">
          <PageHeader
            title="Inviter des collaborateurs"
            description="Un mail leur sera envoyé dès que le workspace sera créé"
          />
          <div className="flex flex-col gap-3.5">
            <InviteForm rawToken={token!} />
            <Separator orientation="horizontal" className="bg-stroke-soft" />
            <InvitedEmails initialEmails={invitations} token={token!} />
          </div>
        </div>
      </>
    );
  }

  throw new Error('Unhandled status');
}

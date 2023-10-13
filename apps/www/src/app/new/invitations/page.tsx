import { InviteForm } from '~/app/new/invitations/invite-form.tsx';
import { InvitedEmails } from '~/app/new/invitations/invited-emails.tsx';
import { parseToken } from '~/app/new/invitations/parse-token.ts';
import { api } from '~/server/api/clients/server.ts';

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const token = searchParams.token;
  const data = parseToken(token);

  if (data.status !== 'valid') return <p>No token provided</p>;

  const initialEmails = await api.workspace.invitation.getMany.query({
    token: token,
  });

  return (
    <main className="container py-8">
      <p>Invitations</p>
      <InvitedEmails initialEmails={initialEmails.emails} />
      <InviteForm rawToken={token!} />
    </main>
  );
}

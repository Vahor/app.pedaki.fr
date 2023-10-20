import { InviteForm } from '~/app/new/(paid)/invitations/invite-form.tsx';
import { InvitedEmails } from '~/app/new/(paid)/invitations/invited-emails.tsx';
import { parseToken } from '~/app/new/(paid)/invitations/parse-token.ts';
import { api } from '~/server/api/clients/server.ts';

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const token = searchParams.token;
  const data = parseToken(token);

  // TODO: handle invalid/expired token
  if (data.status !== 'valid') return <pre>{JSON.stringify(data, null, 2)}</pre>;

  const initialEmails = await api.workspace.invitation.getMany.query({
    token: token!,
  });

  return (
    <main className="container py-8">
      <p>Invitations</p>
      <InvitedEmails initialEmails={initialEmails.emails} />
      <InviteForm rawToken={token!} />
    </main>
  );
}

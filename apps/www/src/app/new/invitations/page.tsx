import {parseToken} from "~/app/new/invitations/parse-token.ts";

export default function InvitationPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const token = searchParams.token;
  const data = parseToken(token);


  return (
    <main className="container py-8">
      <p>Invitations</p>
      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}

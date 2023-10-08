import { loadInitialIsPaid } from '~/app/new/load-initial-is-paid.ts';

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const pendingId = searchParams.pendingId;
  const initialIsPaid = await loadInitialIsPaid(pendingId);

  if (initialIsPaid.status === 'invalid') {
    return <p>Invalid Id</p>;
  }

  if (initialIsPaid.status === 'expired') {
    return (
      <p>
        Soit l'id correspond a un paiement trop ancien soit il n'est pas bon. Sauf si la personne
        l'a entré a la main, c'est qu'il est trop ancien
      </p>
    );
  }

  return (
    <main className="container py-8">
      <p>Invitations</p>
    </main>
  );
}

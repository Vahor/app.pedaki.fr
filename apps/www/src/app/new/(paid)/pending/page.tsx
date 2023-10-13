import { loadInitialIsPaid } from '~/app/new/(paid)/pending/load-initial-is-paid.ts';
import PaymentPendingIndicator from '~/app/new/(paid)/pending/PaymentPendingIndicator.tsx';

export default async function PendingPaymentPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const pendingId = searchParams.token;
  const initialIsPaid = await loadInitialIsPaid(pendingId);

  if (initialIsPaid.status === 'invalid') {
    return <p>Invalid Id</p>;
  }

  if (initialIsPaid.status === 'expired') {
    return (
      <p>
        Soit l&apos;id correspond a un paiement trop ancien soit il n&apos;est pas bon. Sauf si la
        personne l&apos;a entré a la main, c&apos;est qu&apos;il est trop ancien
      </p>
    );
  }

  return (
    <main className="container py-8">
      <p>Here I suppose this will be a page where we&apos;ll wait for the stripe paiement</p>
      <pre>{JSON.stringify(searchParams, null, 2)}</pre>
      <p>TODO: make a api request to check that the pendingId is valid</p>
      <p>If that&apos;s the case, show that the paiement was successful</p>
      <pre>{JSON.stringify(initialIsPaid, null, 2)}</pre>
      <PaymentPendingIndicator
        initialIsPaid={initialIsPaid.status === 'paid'}
        pendingId={pendingId!}
      />
    </main>
  );
}

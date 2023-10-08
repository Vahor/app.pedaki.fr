export default function PaiementPage({ searchParams }: { searchParams: Record<string, string> }) {
  const status = searchParams.status; // 'cancel' or 'success'
  const pendingId = searchParams.pendingId; // the id of the pending paiement
  // TODO: check that both are defined

  return (
    <main className="container py-8">
      <p>Here I suppose this will be a page where we'll wait for the stripe paiement</p>
      <pre>{JSON.stringify(searchParams, null, 2)}</pre>
      <p>TODO: make a api request to check that the pendingId is valid</p>
      <p>If that's the case, show that the paiement was successful</p>
    </main>
  );
}

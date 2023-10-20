import { env } from '~/env.mjs';

export default function Home() {
  return (
    <main className="container py-8">
      <a href={env.NEXT_PUBLIC_WWW_URL}>Home</a>
    </main>
  );
}

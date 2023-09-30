import { Separator } from '@pedaki/design/ui/separator.js';
import { User } from '~/app/user';
import { env } from '~/env.mjs';
import { auth } from '~/server/auth/index.ts';
import {
  DeleteAccountButton,
  GetProfileButton,
  LoginButton,
  LogoutButton,
  SendMailButton,
} from './auth';

export default async function Home() {
  const session = await auth();

  return (
    <main className="container py-8">
      <LoginButton />
      <LogoutButton />
      <DeleteAccountButton />
      <SendMailButton />
      <GetProfileButton />
      <a href={env.NEXT_PUBLIC_WWW_URL}>Home</a>
      <h2>Server Session</h2>
      <pre>{JSON.stringify(session)}</pre>
      <h2>Client Call</h2>
      <User />
      <Separator className="my-8" />
    </main>
  );
}

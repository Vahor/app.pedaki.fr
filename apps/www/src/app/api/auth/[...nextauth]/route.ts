import { authOptions } from '~/server/auth/index.ts';
import NextAuth from 'next-auth';

const handler = NextAuth(authOptions) as Function;

export { handler as GET, handler as POST };

import type { DefaultSession, NextAuthOptions } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import type { GetTokenParams, JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      image: string;
      name: string;
      email: string;
    };
  }
}

const useSecureCookies = process.env.NODE_ENV === 'production';

export const baseAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
  useSecureCookies: useSecureCookies,
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.pedaki.fr' : undefined,
        secure: useSecureCookies,
      },
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [],
} satisfies NextAuthOptions;

export const authFromRequest = async (
  req: Partial<Pick<GetTokenParams['req'], 'headers' | 'cookies'>>,
): Promise<JWT | null> => {
  return await getToken({
    // @ts-expect-error I know what I'm doing
    req: req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: baseAuthOptions.useSecureCookies,
    cookieName: baseAuthOptions.cookies.sessionToken.name,
  });
};

import type { DefaultSession, NextAuthOptions } from 'next-auth';
import { getToken   } from 'next-auth/jwt';
import type {GetTokenParams, JWT} from 'next-auth/jwt';

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

export const baseAuthOption = {
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
    secureCookie: baseAuthOption.useSecureCookies,
    cookieName: baseAuthOption.cookies.sessionToken.name,
  });
};

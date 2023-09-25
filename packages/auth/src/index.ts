import type { DefaultSession, NextAuthOptions } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import type { GetTokenParams, JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends Omit<DefaultSession, 'user'> {
    user: {
      image: string;
      name: string;
      email: string;
      id: string;
      emailVerified: boolean;
      workspaces: {
        id: string;
      }[];
    };
  }
  // Database results (also the output type of the `authorize`, `profile` callback)
  interface User {
    id: string;
    image: string;
    email: string;
    name: string;
    emailVerified: Date | null;
    workspaces: {
      id: string;
    }[];
  }
}

declare module 'next-auth/jwt' {
  // Globally the same thing, this is the output type of the `jwt` callback
  // One main difference is the picture field which corresponds to the user's image field
  interface JWT {
    name: string;
    email: string;
    id: string;
    emailVerified: boolean;
    picture: string;
    workspaces: {
      id: string;
    }[];
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

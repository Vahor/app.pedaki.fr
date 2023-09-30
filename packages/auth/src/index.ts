import type { Permission } from '~/permissions';
import type { DefaultSession, NextAuthOptions } from 'next-auth';

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
        roles: {
          id: string;
          permissions: Permission[];
        }[];
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
      roles: {
        id: string;
        permissions: Permission[];
      }[];
    }[];
  }
}

declare module 'next-auth/jwt' {
  // Globally the same thing, this is the output type of the `jwt` callback
  // One main difference is the picture field which corresponds to the user's image field
  interface JWT {
    iat: number;
    name: string;
    email: string;
    id: string;
    emailVerified: boolean;
    picture: string;
    workspaces: {
      id: string;
      roles: {
        id: string;
        permissions: Permission[];
      }[];
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
        sameSite: 'lax' as const,
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.pedaki.fr' : undefined,
        secure: useSecureCookies,
      },
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
  providers: [],
} satisfies NextAuthOptions;

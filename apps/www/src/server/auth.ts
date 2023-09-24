import { PrismaAdapter } from '@auth/prisma-adapter';
import { baseAuthOptions } from '@pedaki/auth';
import { generateDataURL } from '@pedaki/common/utils/circle-gradient';
import { matchPassword } from '@pedaki/common/utils/hash';
import { prisma } from '@pedaki/db';
import { env } from '~/env.mjs';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import type { GoogleProfile } from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  ...baseAuthOptions,
  pages: {
    signIn: '/auth/login',
    error: '/auth/login', // Error code passed in query string as ?error=
  },
  // @ts-expect-error - The type from next-auth and @auth/prisma-adapter are incompatible
  adapter: PrismaAdapter(prisma),
  callbacks: {
    jwt: ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified !== null;
      }

      if (trigger === 'update') {
        // TODO: Check type of session
        // We are only expecting the user.emailVerified property to be updated (confirm-email)
        const checkedSession = session as {
          user: { emailVerified: boolean };
        };
        if (checkedSession.user.emailVerified) {
          token.emailVerified = checkedSession.user.emailVerified;
        }
      }

      return token;
    },
    session: ({ session, token }) => {
      // console.log("Session Callback", { session, token });
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          emailVerified: token.emailVerified,
        },
      };
    },
    signIn: ({ user, account }) => {
      console.log("Sign In Callback", { user, account });

      // TODO check spam email

      return true;
    },
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      profile(profile: GoogleProfile) {
        // Called only for the first login
        // The output data is then inserted in the database
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: generateDataURL(profile.name, 128),
          emailVerified: profile.email_verified ? new Date() : false,
        };
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user?.password) {
          return null;
        }

        const passwordMatch = matchPassword(credentials.password, user.password, env.PASSWORD_SALT);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified ?? false,
        };
      },
    }),
  ],
};

export const auth = () => {
  return getServerSession(authOptions);
};

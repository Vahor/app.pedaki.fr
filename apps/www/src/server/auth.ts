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
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      profile(profile: GoogleProfile) {
        console.log('google profile', profile);
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: generateDataURL(profile.name, 128),
          emailVerified: false,
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
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
};

export const auth = () => {
  return getServerSession(authOptions);
};

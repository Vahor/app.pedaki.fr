import { PrismaAdapter } from '@auth/prisma-adapter';
import { baseAuthOptions } from '@pedaki/auth';
import type { Permission } from '@pedaki/auth/permissions';
import { allPermissions } from '@pedaki/auth/permissions.js';
import { generateDataURL } from '@pedaki/common/utils/circle-gradient.js';
import { matchPassword } from '@pedaki/common/utils/hash.js';
import { prisma } from '@pedaki/db';
import { env } from '~/env.mjs';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { GoogleProfile } from 'next-auth/providers/google';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  ...baseAuthOptions,
  debug: false,
  pages: {
    signIn: '/auth/login',
    error: '/auth/login', // Error code passed in query string as ?error=
  },
  adapter: {
    ...PrismaAdapter(prisma),
    // @ts-expect-error - The type from next-auth and @auth/prisma-adapter are incompatible
    //  That's why we remove the workspaces
    createUser: data => {
      const { workspaces, ...rest } = data;
      return prisma.user.create({ data: rest });
    },
    async getUserByAccount(provider_providerAccountId) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              emailVerified: true,
              memberships: {
                select: {
                  workspaceId: true,
                  roles: {
                    select: {
                      role: {
                        select: {
                          id: true,
                          permissions: true,
                          isAdmin: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!account) {
        return null;
      }
      const user = account.user;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        workspaces: user.memberships.map(m => ({
          id: m.workspaceId,
          roles: m.roles.flatMap(r => ({
            id: r.role.id,
            permissions: r.role.isAdmin
              ? allPermissions
              : r.role.permissions.map(p => p.identifier as Permission),
          })),
        })),
      };
    },
  },
  callbacks: {
    jwt: ({ token, user, trigger, session }) => {
      // console.log({token})
      token._v ||= 0; // Set version to 0 if it's not set

      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified !== null;
        token.workspaces = user.workspaces;
      }

      // TODO: periodically check if we need to update the token
      //  Or if we need to disable the token

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
      // console.log({ session, token })
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          emailVerified: token.emailVerified,
          workspaces: token.workspaces,
        },
      };
    },
    signIn: ({ user, account }) => {
      // TODO check spam email

      return true;
    },
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      profile(profile: GoogleProfile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture ?? generateDataURL(profile.name),
          emailVerified: profile.email_verified ? new Date() : null,
          workspaces: [],
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
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            password: true,
            memberships: {
              select: {
                workspaceId: true,
                roles: {
                  select: {
                    role: {
                      select: {
                        id: true,
                        permissions: true,
                        isAdmin: true,
                      },
                    },
                  },
                },
              },
            },
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
          workspaces: user.memberships.map(m => ({
            id: m.workspaceId,
            roles: m.roles.flatMap(r => ({
              id: r.role.id,
              permissions: r.role.isAdmin
                ? allPermissions
                : r.role.permissions.map(p => p.identifier as Permission),
            })),
          })),
        };
      },
    }),
  ],
};

export const auth = () => {
  return getServerSession(authOptions);
};

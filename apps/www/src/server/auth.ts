import type {NextAuthOptions} from 'next-auth';
import {getServerSession} from 'next-auth';
import {baseAuthOptions} from '@pedaki/auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider, { type GoogleProfile } from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import {prisma} from '@pedaki/db';
import { env } from '~/env.mjs';
import { matchPassword } from '@pedaki/common/utils/hash';
import { generateDataURL } from '@pedaki/common/utils/circle-gradient';


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

                // If it's his first login he doesn't have an image
                // So we generate one and update his profile
                let image = user.image;
                if (!image) {
                    image = generateDataURL(user.name, 128);
                    await prisma.user.update({
                        where: {
                            id: user.id,
                        },
                        data: {
                            image,
                        }
                    });
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: image,
                    emailVerified: user.emailVerified,
                };
            },
        }),
    ],
};

export const auth = () => {
    return getServerSession(authOptions);
};

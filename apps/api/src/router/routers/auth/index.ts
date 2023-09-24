import {generateDataURL} from '@pedaki/common/utils/circle-gradient';
import {hashPassword} from '@pedaki/common/utils/hash';
import {prisma} from '@pedaki/db';
import type {Prisma} from '@prisma/client';
import {TRPCError} from '@trpc/server';
import {env} from '~/env';
import {UserModelSchema} from '~/models/user.model';
import {publicProcedure, router} from '../../trpc';
import {z} from 'zod';

export const authRouter = router({
    signup: publicProcedure.input(UserModelSchema.omit({id: true})).mutation(async ({input}) => {
        const password = hashPassword(input.password, env.PASSWORD_SALT);

        try {
            await prisma.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    password,
                    image: generateDataURL(input.name, 128),
                },
            });
        } catch (e) {
            if ((e as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'ALREADY_EXISTS',
                });
            }
        }
    }),

    debug_delete_account: publicProcedure
        .meta({openapi: {method: 'POST', path: '/auth/debug/delete-account'}})
        .input(UserModelSchema.pick({id: true}))
        .output(z.any())
        .mutation(async ({input}) => {
            try {
                await prisma.user.delete({
                    where: {
                        id: input.id,
                    },
                });
            } catch (e) {
                // If the user doesn't exist, we don't care
            }
        }),

  profile: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/auth/profile' } })
    .input(z.undefined())
    .output(z.any())
    .query(({ctx}) => {
        return ctx.session;
    })
});

import { generateDataURL } from '@pedaki/common/utils/circle-gradient.js';
import { hashPassword } from '@pedaki/common/utils/hash.js';
import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { env } from '~/env';
import { UserModel } from '~/models/user.model';
import { confirmEmailFlow } from '~/services/emails/confirmEmailFlow';
import { getTokenOrThrow } from '~/services/tokens';
import { z } from 'zod';
import { privateProcedure, publicProcedure, router } from '../../trpc.ts';

export const authRouter = router({
  signup: publicProcedure.input(UserModel.omit({ id: true })).mutation(async ({ input }) => {
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
    .meta({ openapi: { method: 'POST', path: '/auth/debug/delete-account', tags: ["Auth"] } })
    .input(UserModel.pick({ id: true }))
    .output(z.any())
    .mutation(async ({ input }) => {
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

  debug_send_validation_email: privateProcedure.mutation(({ ctx }) => {
    return confirmEmailFlow(prisma, {
      id: ctx.session.id,
      name: ctx.session.name,
      email: 'nathan.d0601@gmail.com', //ctx.session.email
    });
  }),

  confirmEmail: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { token } = input;

      const tokenRecord = await getTokenOrThrow(prisma, token, true);

      if (tokenRecord.userId === null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'INVALID_TOKEN',
        });
      }

      // If everything is ok, update the user
      await prisma.user.update({
        where: {
          id: tokenRecord.userId,
        },
        data: {
          emailVerified: new Date(),
        },
      });
    }),

  profile: privateProcedure
    .meta({ openapi: { method: 'GET', path: '/auth/profile', tags: ["Auth"], protect: true } })
    .input(z.undefined())
    .output(z.any())
    .query(({ ctx }) => {
      return ctx.session;
    }),
});

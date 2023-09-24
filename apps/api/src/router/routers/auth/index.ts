import { generateDataURL } from '@pedaki/common/utils/circle-gradient';
import { hash256, hashPassword } from '@pedaki/common/utils/hash';
import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { env } from '~/env';
import { UserModelSchema } from '~/models/user.model';
import { confirmEmailFlow } from '~/router/routers/auth/confirmEmailFlow';
import { z } from 'zod';
import { privateProcedure, publicProcedure, router } from '../../trpc';

export const authRouter = router({
  signup: publicProcedure.input(UserModelSchema.omit({ id: true })).mutation(async ({ input }) => {
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
    .meta({ openapi: { method: 'POST', path: '/auth/debug/delete-account' } })
    .input(UserModelSchema.pick({ id: true }))
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

      const hashedToken = hash256(token);

      // Look for the token
      const tokenRecord = await prisma.token.findFirst({
        where: {
          type: 'CONFIRM_EMAIL',
          hashedToken: hashedToken,
        },
      });

      // If the token is not found, throw an error
      if (!tokenRecord) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'INVALID_TOKEN',
        });
      }

      // If the token is expired, throw an error
      if (tokenRecord.expiresAt < new Date() || tokenRecord.userId === null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'EXPIRED_TOKEN',
        });
      }

      // Delete the token
      await prisma.token.delete({
        where: {
          unique_token: {
            type: 'CONFIRM_EMAIL',
            hashedToken: hashedToken,
          },
        },
      });

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

  profile: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/auth/profile' } })
    .input(z.undefined())
    .output(z.any())
    .query(({ ctx }) => {
      return ctx.session;
    }),
});

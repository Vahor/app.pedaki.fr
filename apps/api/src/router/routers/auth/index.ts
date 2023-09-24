import { generateDataURL } from '@pedaki/common/utils/circle-gradient';
import { hashPassword } from '@pedaki/common/utils/hash';
import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { env } from '~/env';
import { UserModelSchema } from '~/models/user.model';
import { publicProcedure, router } from '../../trpc';

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
});

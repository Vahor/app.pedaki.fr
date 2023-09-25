import { hash256 } from '@pedaki/common/utils/hash.js';
import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export const getTokenOrThrow = async (prisma: PrismaClient, token: string, deleteToken = true) => {
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
  if (tokenRecord.expiresAt < new Date()) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'EXPIRED_TOKEN',
    });
  }
  if (deleteToken) {
    // Delete the token
    await prisma.token.delete({
      where: {
        unique_token: {
          type: 'CONFIRM_EMAIL',
          hashedToken: hashedToken,
        },
      },
    });
  }

  return tokenRecord;
};

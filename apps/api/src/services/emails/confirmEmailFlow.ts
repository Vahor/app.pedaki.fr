import { hash256 } from '@pedaki/common/utils/hash.js';
import { generateToken } from '@pedaki/common/utils/random.js';
import { sendEmail } from '@pedaki/mailer';
import type { PrismaClient } from '@prisma/client';
import { env } from '~/env';
import ConfirmEmailTemplate from './templates/confirm-email.tsx';

export const confirmEmailFlow = async (
  prisma: PrismaClient,
  params: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  },
) => {
  const token = generateToken(64);
  const hashedToken = hash256(token);
  const { user } = params;

  // TODO check for spamming

  await prisma.$transaction([
    // Delete all previous tokens
    prisma.token.deleteMany({
      where: {
        userId: user.id,
        type: 'CONFIRM_EMAIL',
      },
    }),
    // Create a new token
    prisma.token.create({
      data: {
        userId: user.id,
        type: 'CONFIRM_EMAIL',
        hashedToken: hashedToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes
      },
    }),
  ]);

  // Send email
  await sendEmail(user.email, ConfirmEmailTemplate, {
    name: user.name,
    url: `${env.APP_URL}/auth/confirm-email?token=${token}`,
  });
  console.log(`[CONFIRM_EMAIL] ${user.email} ${token}`);
};

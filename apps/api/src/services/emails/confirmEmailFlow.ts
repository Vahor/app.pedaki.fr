import { hash256 } from '@pedaki/common/utils/hash';
import { generateToken } from '@pedaki/common/utils/random';
import { sendEmail } from '@pedaki/mailer';
import { ConfirmEmailTemplate } from '@pedaki/mailer/templates';
import type { PrismaClient } from '@prisma/client';
import { env } from '~/env';

export const confirmEmailFlow = async (
  prisma: PrismaClient,
  user: {
    id: string;
    name: string;
    email: string;
  },
) => {
  const token = generateToken(64);
  const hashedToken = hash256(token);

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
  const a = await sendEmail(user.email, ConfirmEmailTemplate, {
    name: user.name,
    url: `${env.APP_URL}/auth/confirm-email?token=${token}`,
  });
  console.log(a);

  console.log(`[CONFIRM_EMAIL] ${user.email} ${token}`);
};

import { hash256 } from '@pedaki/common/utils/hash.js';
import { generateToken } from '@pedaki/common/utils/random.js';
import { sendEmail } from '@pedaki/mailer';
import type { PrismaClient } from '@prisma/client';
import { env } from '~/env';
import InviteInWorkspaceTemplate from '~/services/emails/templates/invite-in-workspace.tsx';

export const inviteInWorkspaceFlow = async (
  prisma: PrismaClient,
  params: {
    user: {
      email: string;
    };
    workspace: {
      id: string;
      name: string;
    };
  },
) => {
  const token = generateToken(64);
  const hashedToken = hash256(token);
  const { user, workspace } = params;

  // TODO check for spamming

  await prisma.$transaction([
    // Delete all previous tokens
    prisma.workspaceInvitation.deleteMany({
      where: {
        email: user.email,
        workspaceId: workspace.id,
      },
    }),
    // Create a new token
    prisma.workspaceInvitation.create({
      data: {
        email: user.email,
        workspace: {
          connect: {
            id: workspace.id,
          },
        },
        token: {
          create: {
            type: 'WORKSPACE_INVITATION',
            hashedToken: hashedToken,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
          },
        },
      },
    }),
  ]);

  // Send email
  await sendEmail(user.email, InviteInWorkspaceTemplate, {
    email: user.email,
    url: `${env.APP_URL}/invitation?token=${token}`,
    workspaceName: workspace.name,
  });
  console.log(`[INVITE_EMAIL] ${user.email} ${token}`);
};

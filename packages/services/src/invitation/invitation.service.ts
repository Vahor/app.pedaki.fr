import { prisma } from '@pedaki/db';
import { WorkspaceNotFoundError } from '@pedaki/models/errors/index.js';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';

class InvitationService {
  async addPendingInvite(workspaceId: string, email: string, name: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { billingEmail: true },
    });

    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }

    if (workspace.billingEmail === email) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'MAIN_EMAIL',
      });
    }

    try {
      await prisma.pendingWorkspaceInvite.create({
        data: {
          name: name,
          email: email,
          workspaceId: workspaceId,
        },
      });
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'ALREADY_EXISTS',
        });
      }
      throw error;
    }
  }

  async getAllInvites(workspaceId: string): Promise<{ email: string; name: string }[]> {
    return await prisma.pendingWorkspaceInvite.findMany({
      where: { workspaceId: workspaceId },
      orderBy: { createdAt: 'asc' },
      select: { email: true, name: true },
    });
  }

  async deleteManyInvites(workspaceId: string, emails: string[]): Promise<void> {
    const result = await prisma.pendingWorkspaceInvite.deleteMany({
      where: {
        workspaceId: workspaceId,
        email: {
          in: emails,
        },
      },
    });

    console.log(`Deleted ${result.count} invites for workspace ${workspaceId}`);
  }
}

const invitationService = new InvitationService();
export { invitationService };

import { prisma } from '@pedaki/db';
import { logger } from '@pedaki/logger';
import { WorkspaceNotFoundError } from '@pedaki/models/errors/index.js';
import { InvalidStateError } from '@pedaki/models/errors/InvalidStateError.js';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';

class InvitationService {
  async addPendingInvite(workspaceId: string, email: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { contactEmail: true, expectedStatus: true },
    });

    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }

    if (workspace.contactEmail === email) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'MAIN_EMAIL',
      });
    }

    // We won't read invites after the workspace is created
    if (workspace.expectedStatus !== 'CREATING') {
      throw new InvalidStateError();
    }

    try {
      await prisma.pendingWorkspaceInvite.create({
        data: {
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

  async deletePendingInvite(workspaceId: string, email: string): Promise<void> {
    await prisma.pendingWorkspaceInvite.delete({
      where: { email_workspaceId: { email: email, workspaceId: workspaceId } },
    });
  }

  async getAllInvites(workspaceId: string): Promise<{ email: string }[]> {
    return await prisma.pendingWorkspaceInvite.findMany({
      where: { workspaceId: workspaceId },
      orderBy: { createdAt: 'asc' },
      select: { email: true },
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

    logger.info(`Deleted ${result.count} invites for workspace ${workspaceId}`);
  }
}

const invitationService = new InvitationService();
export { invitationService };

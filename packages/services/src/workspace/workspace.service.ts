import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';


class WorkspaceService {
  getHealthStatusUrl(identifier: string) {
    return `https://${identifier}.pedaki.fr/api/_health`;
  }

  getWorkspaceUrl(identifier: string) {
    return `https://${identifier}.pedaki.fr`;
  }

  async addPendingInvite(workspaceId: string, email: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { mainEmail: true },
    });
    if (!workspace) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'NOT_FOUND',
      });
    }
    if (workspace.mainEmail === email) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'MAIN_EMAIL',
      });
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
}

const workspaceService = new WorkspaceService();
export { workspaceService };
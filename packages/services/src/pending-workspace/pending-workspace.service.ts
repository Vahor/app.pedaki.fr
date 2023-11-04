import { encrypt } from '@pedaki/common/utils/hash.js';
import { prisma } from '@pedaki/db';
import type { CreateWorkspaceInput } from '@pedaki/schema/workspace.model.js';
import { env } from '~/env';
import type { PendingWorkspace } from '~/pending-workspace/pending-workspace.model.ts';
import { workspaceService } from '~/workspace/workspace.service.ts';
import type z from 'zod';

class PendingWorkspaceService {
  async create(input: z.infer<typeof CreateWorkspaceInput>): Promise<PendingWorkspace['id']> {
    const jsonData = JSON.stringify(input);

    const pending = await prisma.pendingWorkspaceCreation.create({
      data: {
        data: jsonData,
        identifier: input.identifier,
      },
      select: {
        id: true,
      },
    });

    return pending.id;
  }

  async linkStripePayment(pendingId: PendingWorkspace['id'], paymentId: string): Promise<void> {
    await prisma.pendingWorkspaceCreation.update({
      where: {
        id: pendingId,
      },
      data: {
        stripePaymentId: paymentId,
      },
      select: {
        id: true,
      },
    });
  }

  generateToken(
    pendingWorkspace: Required<Pick<PendingWorkspace, 'identifier' | 'paidAt' | 'workspaceId'>>,
  ): string {
    // 3 hour after payment
    const expirationDate = new Date(pendingWorkspace.paidAt.getTime() + 1000 * 60 * 60 * 3);

    const raw = {
      workspaceId: pendingWorkspace.workspaceId,
      workspaceHealthUrl: workspaceService.getHealthStatusUrl(pendingWorkspace.identifier),
      workspaceUrl: workspaceService.getWorkspaceUrl(pendingWorkspace.identifier),
      expiresAt: expirationDate,
    };

    return encrypt(JSON.stringify(raw), env.API_ENCRYPTION_KEY);
  }
}

const pendingWorkspaceService = new PendingWorkspaceService();
export { pendingWorkspaceService };

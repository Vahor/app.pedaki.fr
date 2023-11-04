import { decrypt, encrypt } from '@pedaki/common/utils/hash.js';
import { prisma } from '@pedaki/db';
import type { CreateWorkspaceInput } from '@pedaki/schema/workspace.model.js';
import { TRPCError } from '@trpc/server';
import { env } from '~/env.ts';
import type { PendingWorkspace } from '~/pending-workspace/pending-workspace.model.ts';
import { workspaceService } from '~/workspace/workspace.service.ts';
import z from 'zod';

class PendingWorkspaceService {
  tokenSchema = z.object({
    workspaceId: z.string(),
    expiresAt: z.coerce.date(),
    workspaceHealthUrl: z.string(),
    workspaceUrl: z.string(),
  });

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

    const raw: z.infer<typeof this.tokenSchema> = {
      workspaceId: pendingWorkspace.workspaceId,
      workspaceHealthUrl: workspaceService.getHealthStatusUrl(pendingWorkspace.identifier),
      workspaceUrl: workspaceService.getWorkspaceUrl(pendingWorkspace.identifier),
      expiresAt: expirationDate,
    };

    return encrypt(JSON.stringify(raw), env.API_ENCRYPTION_KEY);
  }

  decryptToken(token: string): z.infer<typeof this.tokenSchema> {
    const decrypted = decrypt(token, env.API_ENCRYPTION_KEY);
    const parsed = this.tokenSchema.parse(JSON.parse(decrypted));
    if (new Date(parsed.expiresAt) < new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'EXPIRED',
      });
    }
    return parsed;
  }
}

const pendingWorkspaceService = new PendingWorkspaceService();
export { pendingWorkspaceService };

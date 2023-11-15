import { decrypt, encrypt } from '@pedaki/common/utils/hash.js';
import { prisma } from '@pedaki/db';
import type {
  PendingToken,
  PendingWorkspace,
} from '@pedaki/models/pending-workspace/pending-workspace.model.js';
import { PendingTokenSchema } from '@pedaki/models/pending-workspace/pending-workspace.model.js';
import type { CreateWorkspaceInput } from '@pedaki/models/workspace/api-workspace.model.js';
import { TRPCError } from '@trpc/server';
import { env } from '~/env.ts';
import { workspaceService } from '~/workspace/workspace.service.ts';
import type z from 'zod';

class PendingWorkspaceService {
  async create(input: z.infer<typeof CreateWorkspaceInput>): Promise<PendingWorkspace['id']> {
    const jsonData = JSON.stringify(input);

    // Check that the identifier is not already taken
    const existing = await prisma.$transaction([
      prisma.workspace.count({
        where: {
          identifier: input.identifier,
        },
      }),
      prisma.pendingWorkspaceCreation.count({
        where: {
          identifier: input.identifier,
        },
      }),
    ]);

    if (existing[0] > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'workspace_already_exists',
      });
    }
    if (existing[1] > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'pending_already_exists',
      });
    }

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

    const raw: PendingToken = {
      identifier: pendingWorkspace.identifier,
      workspaceId: pendingWorkspace.workspaceId,
      workspaceUrl: workspaceService.getWorkspaceUrl(pendingWorkspace.identifier),
      expiresAt: expirationDate,
    };

    return encrypt(JSON.stringify(raw), env.API_ENCRYPTION_KEY);
  }

  decryptToken(token: string): PendingToken {
    const decrypted = decrypt(token, env.API_ENCRYPTION_KEY);
    const parsed = PendingTokenSchema.parse(JSON.parse(decrypted));
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

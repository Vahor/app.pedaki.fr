import type z from 'zod';
import type {CreateWorkspaceInput} from '@pedaki/schema/workspace.model.js';
import {prisma} from '@pedaki/db';
import type {PendingWorkspaceId} from "~/pending-workspace/pending-workspace.model.ts";

class PendingWorkspaceService {

    async create(input: z.infer<typeof CreateWorkspaceInput>): Promise<PendingWorkspaceId> {
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

    async linkStripePayment(pendingId: PendingWorkspaceId, paymentId: string): Promise<void> {
        await prisma.pendingWorkspaceCreation.update({
            where: {
                id: pendingId,
            },
            data: {
                stripePaymentId: paymentId,
            },
        });
    }

}

const pendingWorkspaceService = new PendingWorkspaceService();
export default pendingWorkspaceService;
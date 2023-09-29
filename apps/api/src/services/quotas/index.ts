import type {PrismaClient} from '@prisma/client';
import type {QuotaTarget, QuotaType} from './defaults.ts';
import {DEFAULT_QUOTA_LIMITS} from './defaults.ts';
import { TRPCError } from '@trpc/server';

type QuotaMethod = (
    prisma: PrismaClient,
    userId: string,
    workspaceId?: string,
) => Promise<{
    [target in QuotaTarget]?: number;
}>

export const assertQuota = async (
    prisma: PrismaClient,
    type: QuotaType,
    userId: string,
    workspaceId?: string,
) => {
    const quotaLimits = DEFAULT_QUOTA_LIMITS[type];
    const method = getCurrentUsage[type] ?? null;
    if (!quotaLimits || !method) {
        throw new Error(`Quota type '${type}' not found`);
    }
    const currentUsage = await method(prisma, userId, workspaceId);
    Object.entries(quotaLimits).forEach(([target, limit]) => {
        const current = currentUsage[target as QuotaTarget];
        if (current === undefined) {
            return;
        }
        if (current >= limit) {
            throw new TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: `QUOTA_EXCEEDED`,
            });
        }
    })
};

/**
 * Retourne le nombre de workspaces possédés par l'utilisateur
 */
export const getCurrentUsage_WORKSPACE: QuotaMethod = async (prisma, userId, workspaceId) => {
    const count = await prisma.workspace.count({
        where: {
            members: {
                some: {
                    userId,
                }
            }
        }
    });

    console.log({count})

    return {
        USER: count,
    };
};


const getCurrentUsage = {
    WORKSPACE: getCurrentUsage_WORKSPACE,
} as {
    [type in QuotaType]: QuotaMethod;
};

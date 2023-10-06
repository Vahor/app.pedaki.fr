import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type { QuotaLimits, QuotaTarget, QuotaTargetForType, QuotaType } from './defaults.ts';
import { DEFAULT_QUOTA_LIMITS } from './defaults.ts';

type QuotaMethod<Target extends QuotaTarget = QuotaTarget> = (
  prisma: PrismaClient,
  target: Target,
  // We assume that if target is USER, then entity is a user
  entityId: Target extends 'GLOBAL' ? null : string,
) => Promise<number | null>;

const loadCustomQuotas = async (
  prisma: PrismaClient,
  type: QuotaType,
  target: QuotaTarget,
  entityId: string | null,
): Promise<number | null> => {
  const base = DEFAULT_QUOTA_LIMITS[type] as QuotaLimits[QuotaType];

  if (target === 'GLOBAL') {
    return base?.GLOBAL ?? null;
  }

  // TODO: cache redis
  const quotas = await prisma.customQuotas.findFirst({
    where: {
      key: type,
      [target == 'USER' ? 'userId' : 'workspaceId']: entityId,
    },
    select: {
      value: true,
    },
  });

  if (!quotas) {
    return base?.[target] ?? null;
  }

  return quotas.value;
};

export const assertQuota = async <Type extends QuotaType, Target extends QuotaTargetForType<Type>>(
  prisma: PrismaClient,
  type: Type,
  target: Target,
  // We assume that if target is USER, then entity is a user
  entityId: Target extends 'GLOBAL' ? null : string,
) => {
  const quotaLimits = await loadCustomQuotas(prisma, type, target, entityId);
  const method = getCurrentUsage[type] ?? null;
  if (!quotaLimits || !method) {
    throw new Error(`Quota type '${type}' not found`);
  }
  const currentUsage = await method(prisma, target, entityId);
  if (currentUsage === null) {
    return;
  }
  if (currentUsage >= quotaLimits) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `QUOTA_EXCEEDED`,
    });
  }
};

/**
 * Retourne le nombre de workspaces possédés par l'utilisateur
 */
export const getCurrentUsage_IN_WORKSPACE: QuotaMethod<'USER'> = async (
  prisma,
  target,
  entityId,
) => {
  if (target !== 'USER') {
    return null;
  }

  return await prisma.workspace.count({
    where: {
      members: {
        some: {
          email: entityId,
        },
      },
    },
  });
};

const getCurrentUsage = {
  IN_WORKSPACE: getCurrentUsage_IN_WORKSPACE,
} as {
  [type in QuotaType]: QuotaMethod;
};

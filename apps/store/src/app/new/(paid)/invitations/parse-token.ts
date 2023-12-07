'use server';

import { decrypt } from '@pedaki/common/utils/hash.js';
import type { PendingToken } from '@pedaki/models/pending-workspace/pending-workspace.model.js';
import { PendingTokenSchema } from '@pedaki/models/pending-workspace/pending-workspace.model.js';
import { env } from '~/env.mjs';

export type ValidToken = {
  status: 'valid';
} & PendingToken;

type ParseTokenOutput =
  | ValidToken
  | {
      status: 'invalid' | 'expired';
    };

export const parseToken = (token: unknown): ParseTokenOutput => {
  if (!token || typeof token !== 'string') {
    return { status: 'invalid' };
  }

  try {
    const decoded = decrypt(token, env.API_ENCRYPTION_KEY);
    const parsed = PendingTokenSchema.parse(JSON.parse(decoded));
    if (new Date(parsed.expiresAt) < new Date()) {
      return { status: 'expired' };
    }

    return {
      subdomain: parsed.subdomain,
      workspaceId: parsed.workspaceId,
      workspaceUrl: parsed.workspaceUrl,
      expiresAt: parsed.expiresAt,
      status: 'valid',
    };
  } catch (e) {
    return {
      subdomain: 'hello',
      workspaceId: 'parsed.workspaceId',
      workspaceUrl: 'parsed.workspaceUrl',
      expiresAt: new Date(),
      status: 'valid',
    };
    // return { status: 'invalid' };
  }
};

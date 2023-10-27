'use server';

import { decrypt } from '@pedaki/common/utils/hash.js';
import { env } from '~/env.mjs';
import { z } from 'zod';

const schema = z.object({
  workspaceId: z.string(),
  workspaceHealthUrl: z.string(),
  workspaceUrl: z.string(),
  expiresAt: z.string(),
});

export type ValidToken = {
  status: 'valid';
} & z.infer<typeof schema>;

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
    const parsed = schema.parse(JSON.parse(decoded));
    if (new Date(parsed.expiresAt) < new Date()) {
      return { status: 'expired' };
    }

    return {
      workspaceId: parsed.workspaceId,
      workspaceHealthUrl: parsed.workspaceHealthUrl,
      workspaceUrl: parsed.workspaceUrl,
      expiresAt: parsed.expiresAt,
      status: 'valid',
    };
  } catch (e) {
    return { status: 'invalid' };
  }
};

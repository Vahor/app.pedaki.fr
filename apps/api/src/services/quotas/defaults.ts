export type QuotaTarget = 'USER' | 'GLOBAL' | 'WORKSPACE';

export type QuotaLimits = Record<
  string,
  {
    [key in QuotaTarget]?: number;
  }
>;

export const DEFAULT_QUOTA_LIMITS = {
  WORKSPACE: {
    USER: 2,
  },
  CREATE_ROLE: {
    WORKSPACE: 10,
  },
} satisfies QuotaLimits;

export type QuotaType = keyof typeof DEFAULT_QUOTA_LIMITS;

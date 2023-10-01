export type QuotaTarget = 'USER' | 'GLOBAL' | 'WORKSPACE';

// 💩 I don't know how to do this better
export type QuotaLimits = Record<
  string,
  | {
      USER: number;
      GLOBAL?: never;
      WORKSPACE?: never;
    }
  | {
      USER?: never;
      GLOBAL?: never;
      WORKSPACE: number;
    }
  | {
      USER?: never;
      WORKSPACE?: never;
      GLOBAL: number;
    }
>;

export const DEFAULT_QUOTA_LIMITS = {
  // Max number of workspaces a user can be in
  IN_WORKSPACE: {
    USER: 2,
  },
  // Max number of members in a workspace
  MAX_WORKSPACE_MEMBERS: {
    WORKSPACE: 10,
  },
  CREATE_ROLE: {
    WORKSPACE: 10,
  },
  _: {
    GLOBAL: 100,
  },
} satisfies QuotaLimits;

export type QuotaType = keyof typeof DEFAULT_QUOTA_LIMITS;
export type QuotaTargetForType<T extends QuotaType> = T extends keyof typeof DEFAULT_QUOTA_LIMITS
  ? keyof (typeof DEFAULT_QUOTA_LIMITS)[T]
  : never;

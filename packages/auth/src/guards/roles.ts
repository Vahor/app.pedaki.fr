import type { Permission } from './ressources.ts';

export const DefaultRoles: Record<string, readonly Permission[]> = {
  OWNER: ['manage:billing:*', 'manage:member:*', 'manage:workspace:*'],
} as const;

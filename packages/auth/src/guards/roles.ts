import type { Permission } from './ressources';

export const DefaultRoles: Record<string, readonly Permission[]> = {
  OWNER: ['manage:billing:*', 'manage:member:*', 'manage:workspace:*'],
} as const;

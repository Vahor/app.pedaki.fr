import type { Permission } from './permissions.ts';
import { allPermissions } from './permissions.ts';

export const rolesTranslations = {
  fr: {
    admin: { name: 'Administrateur', description: 'Administrateur du workspace' },
    billing: { name: 'Facturation', description: 'Facturation du workspace' },
  },
} as const;

type Role = keyof (typeof rolesTranslations)['fr'];
type Lang = keyof typeof rolesTranslations;

export const getRoleTranslation = (role: Role, lang: string) => {
  const validLang = (lang in rolesTranslations ? lang : 'fr') as Lang;
  return rolesTranslations[validLang][role];
};

export const defaultRoles = [
  {
    key: 'billing',
    permissions: allPermissions.filter(p => p.includes(':billing:')),
  },
] satisfies {
  key: Role;
  permissions: Permission[];
}[];

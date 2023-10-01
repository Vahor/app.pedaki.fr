export const callTypes = ['create', 'read', 'update', 'delete', 'manage'] as const;
export const resources = ['user', 'workspace', 'member', 'billing'] as const;
export const targets = ['user', 'workspace', '*'] as const;

export type CallType = (typeof callTypes)[number];
export type Resource = (typeof resources)[number];
export type Target = (typeof targets)[number];
export type Permission = `${CallType}:${Resource}:${Target}`;

export const allPermissions = (() => {
  const permissions: Permission[] = [];
  callTypes.forEach(callType => {
    resources.forEach(resource => {
      targets.forEach(target => {
        permissions.push(`${callType}:${resource}:${target}`);
      });
    });
  });
  return permissions;
})();

import type {WorkspaceRole} from "@prisma/client"
import type {Permission} from "./ressources";

type RoleToPermissions = {
    [key in WorkspaceRole]: readonly Permission[]
}

export const RoleToPermissions: RoleToPermissions = {
    OWNER: [
        "manage:billing:*",
        "manage:member:*",
        "manage:workspace:*",
    ]
} as const

export const flatPermissions = (roles: readonly WorkspaceRole[]): Set<Permission> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return new Set(roles.flatMap((role: WorkspaceRole) => RoleToPermissions[role]))
}
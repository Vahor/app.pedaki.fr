export type CallType = "create" | "read" | "update" | "delete" | "manage"
export type Resource = "user" | "workspace" | "member" | "billing"
export type Target = "user" | "workspace" | "*"

export type Permission = `${CallType}:${Resource}:${Target}`
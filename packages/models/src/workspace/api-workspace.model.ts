import { ServerResourceSchema } from "~/resource/resource.model.js";
import { isValidServerRegion } from "~/resource/server-region.model.ts";
import { z } from "zod";

const restrictedSubdomains = [
	"api",
	"admin",
	"demo",
	"test",
	"store",
	"auth",
	"app",
	"login",
	"static",
	"assets",
	"files",
	"docs",
];

export const WorkspaceId = z.string().cuid();

export const CreateWorkspaceInput = z.object({
	name: z.string().min(3).max(60),
	subdomain: z
		.string()
		.min(3)
		.max(50)
		.regex(/^[a-z0-9-]+$/, { message: "INVALID_IDENTIFIER" })
		.refine(
			(subdomain) => {
				return !restrictedSubdomains.includes(subdomain);
			},
			{
				message: "RESTRICTED_SUBDOMAIN",
			},
		),

	billing: z.object({
		email: z.string().email(),
		name: z.string(),
		subscriptionInterval: z.enum(["monthly", "yearly"]),
	}),

	defaultLanguage: z.string().max(3),

	server: ServerResourceSchema.pick({
		region: true,
		provider: true,
		size: true,
	}).refine(
		(value) => {
			return value.region && isValidServerRegion(value.provider, value.region);
		},
		{
			message: "INVALID_REGION",
		},
	),
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInput>;

export const CreateWorkspaceResponse = z.object({
	id: WorkspaceId,
});

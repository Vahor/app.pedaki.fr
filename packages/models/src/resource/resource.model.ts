import {
	DnsProviderModel,
	ProviderModel,
	ServerProviderModel,
} from "~/resource/provider.model.ts";
import z from "zod";

const ResourceSchema = z.object({
	region: z.string(),
	provider: ProviderModel,
	id: z.string(),
});

export type Resource = z.infer<typeof ResourceSchema>;
export type ResourceInput = Pick<Resource, "provider" | "region">;

/// Server
export const ServerResourceSchema = ResourceSchema.merge(
	z.object({
		provider: ServerProviderModel,
		type: z.enum(["server"]),
		size: z.enum(["small"]),
		environment_variables: z
			.object({
				PEDAKI_AUTH_TOKEN: z.string(),

				PEDAKI_BILLING_EMAIL: z.string(),
				PEDAKI_BILLING_NAME: z.string(),
			})
			.catchall(z.string()),
	}),
);
export type ServerResource = z.infer<typeof ServerResourceSchema>;
export type ServerResourceInput = Pick<
	ServerResource,
	"size" | "environment_variables"
>;

/// Database
export const DatabaseResourceSchema = ResourceSchema.merge(
	z.object({
		provider: ServerProviderModel,
		type: z.enum(["database"]),
		size: z.enum(["small"]),
	}),
);
export type DatabaseResource = z.infer<typeof DatabaseResourceSchema>;
export type DatabaseResourceInput = Pick<DatabaseResource, "size">;

/// Dns
export const DnsResourceSchema = ResourceSchema.merge(
	z.object({
		provider: DnsProviderModel,
		type: z.enum(["dns"]),
		region: z.null(),
		subdomain: z.string(),
		value: z.string(),
	}),
);

export type DnsResource = z.infer<typeof DnsResourceSchema>;
export type DnsResourceInput = Pick<DnsResource, "subdomain">;

/// Dns
export const VpcResourceSchema = ResourceSchema.merge(
	z.object({
		provider: ServerProviderModel,
	}),
);

export type VpcResource = z.infer<typeof VpcResourceSchema>;
export type VpcResourceInput = Pick<VpcResource, "provider" | "region">;

import { z } from "zod";

export const ServerProviders = ["aws", "test"] as const;
export const DnsProviders = ["cloudflare"] as const;
export const ServerProviderModel = z.enum(ServerProviders);
export const DnsProviderModel = z.enum(DnsProviders);
export const ProviderModel = z.union([ServerProviderModel, DnsProviderModel]);

export type ServerProvider = z.infer<typeof ServerProviderModel>;
export type DnsProvider = z.infer<typeof DnsProviderModel>;
export type Provider = z.infer<typeof ProviderModel>;

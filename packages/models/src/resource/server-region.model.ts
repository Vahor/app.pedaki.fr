import type { ServerProvider } from "~/resource/provider.model.ts";

export const RegionMap: {
	[provider in ServerProvider]: Record<string, string>;
} = {
	aws: {
		"us-east-2": "US East (Ohio)",
		"eu-west-3": "Europe (Paris)",
	} as const,
	test: {
		"us-east-2": "US East (Ohio)",
		"eu-west-3": "Europe (Paris)",
	},
} as const;
export const Region: { [provider in ServerProvider]: string[] } = {
	aws: Object.keys(RegionMap.aws),
	test: Object.keys(RegionMap.test),
} as const;

export const isValidServerRegion = (
	provider: ServerProvider,
	region: string,
): region is ServerRegion<ServerProvider> => {
	return Region[provider].includes(region);
};
export type ServerRegion<T> = T extends ServerProvider
	? (typeof Region)[T][number]
	: never;

import { z } from 'zod';

export const isValidRegion = (provider: Provider, region: string): region is Region<Provider> => {
  return Region[provider].includes(region as any);
};

/// Provider
export const Providers = ['AWS', 'test'] as const;
export const ProviderModel = z.enum(Providers);
export type Provider = z.infer<typeof ProviderModel>;

/// Region
export const RegionMap = {
  AWS: {
    'us-east-2': 'US East (Ohio)',
    'eu-west-3': 'Europe (Paris)',
  } as const,
  test: {
    'us-east-2': 'US East (Ohio)',
    'eu-west-3': 'Europe (Paris)',
  },
} as const;
export const Region = {
  AWS: Object.keys(RegionMap.AWS),
  test: Object.keys(RegionMap.test),
} as const;
export const RegionModel = z.record(ProviderModel, z.array(z.string())).refine(value => {
  return Object.entries(value).every(([provider, regions]) => {
    return regions.every(region => isValidRegion(provider as Provider, region));
  });
});
export type Region<T> = T extends Provider ? (typeof Region)[T][number] : never;

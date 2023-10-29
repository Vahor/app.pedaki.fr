import type { Provider } from '@pedaki/schema/region.model.ts';

export const Region = {
  AWS: ['us-east-2', 'eu-west-3'] as const,
  test: ['us-east-2', 'eu-west-2'] as const,
} satisfies Record<Provider, readonly string[]>;

export type Region<T> = T extends Provider ? (typeof Region)[T][number] : never;

export interface WorkspaceInstance<P extends Provider = Provider> {
  workspaceId: string;
  provider: P;
  machinePublicIp: string;
  region: Region<P>;
}

export interface StackParameters<P extends Provider = Provider> {
  workspaceId: string;
  region: Region<P>;
  size: 'small';
}

export interface StackOutputs {
  machinePublicIp: string;
  publicHostName: string;
}

export interface ServerProvider<P extends Provider = Provider> {
  /**
   * Create a stack
   * @param params stack parameters
   * @returns stack outputs
   * @throws if stack creation fails
   */
  create: (params: StackParameters<P>) => Promise<StackOutputs>;
  /**
   * Delete a stack
   * @param workspaceId the workspace id
   */
  delete: (params: StackParameters<P>) => Promise<void>;
}

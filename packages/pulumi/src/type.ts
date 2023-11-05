import type { ServerProvider } from '@pedaki/models/resource/provider.model.js';
import type { ServerRegion } from '@pedaki/models/resource/server-region.model.js';

export interface WorkspaceInstance<SP extends ServerProvider = ServerProvider> {
  workspaceId: string;
  server: {
    provider: SP;
    machinePublicIp: string;
    region: ServerRegion<SP>;
  };
}

export interface StackParameters<SP extends ServerProvider = ServerProvider> {
  workspaceId: string;
  region: ServerRegion<SP>;
  size: 'small';
  server: {
    region: ServerRegion<SP>;
    provider: ServerProvider;
  };
}

export interface StackOutputs {
  machinePublicIp: string;
  publicHostName: string;
}

export interface StackProvider<SP extends ServerProvider = ServerProvider> {
  /**
   * Create a stack
   * @param params stack parameters
   * @returns stack outputs
   * @throws if stack creation fails
   */
  create: (params: StackParameters<SP>) => Promise<StackOutputs>;
  /**
   * Delete a stack
   * @param workspaceId the workspace id
   */
  delete: (params: StackParameters<SP>) => Promise<void>;
}

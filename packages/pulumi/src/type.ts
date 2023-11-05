import type { ServerProvider } from '@pedaki/models/resource/provider.model.js';
import type {
  DatabaseResourceInput,
  ServerResourceInput,
} from '@pedaki/models/resource/resource.model.js';
import type { ServerRegion } from '@pedaki/models/resource/server-region.model.js';

export interface WorkspaceInstance<SP extends ServerProvider = ServerProvider> {
  identifier: string;
  server: {
    provider: SP;
    machinePublicIp: string;
    region: ServerRegion<SP>;
  };
}

export interface StackParameters<SP extends ServerProvider> {
  identifier: string;
  region: ServerRegion<SP>;
  server: ServerResourceInput;
  database: DatabaseResourceInput;
  dns: null;
}

export interface StackOutputs {
  machinePublicIp: string;
  publicHostName: string;
}

export interface StackProvider<SP extends ServerProvider> {
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

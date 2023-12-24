import type { ServerProvider } from '@pedaki/models/resource/provider.model.js';
import type {
  DatabaseResourceInput,
  DnsResourceInput,
  ServerResourceInput,
} from '@pedaki/models/resource/resource.model.js';
import type { ServerRegion } from '@pedaki/models/resource/server-region.model.js';
import type { StackOutputs } from '~/output.ts';

export interface WorkspaceInstance<SP extends ServerProvider = ServerProvider> {
  subdomain: string;
  server: {
    provider: SP;
    machinePublicIp: string;
    region: ServerRegion<SP>;
  };
}

export interface StackParameters<SP extends ServerProvider> {
  workspace: {
    id: string;
    subdomain: string;
    name: string;
    maintenanceWindow: string;
  };
  region: ServerRegion<SP>;
  server: ServerResourceInput;
  database: DatabaseResourceInput;
  dns: DnsResourceInput;
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

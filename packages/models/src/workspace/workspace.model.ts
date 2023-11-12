import type {
  DatabaseResourceInput,
  DnsResourceInput,
  ServerResourceInput,
  VpcResourceInput,
} from '~/resource/resource.model';

export interface WorkspaceData {
  workspace: {
    identifier: string;
    subscriptionId: number;
  };
  vpc: VpcResourceInput;
  server: ServerResourceInput;
  database: DatabaseResourceInput;
  dns: DnsResourceInput;
}

import { Status } from '@prisma/client';
import type {
  DatabaseResourceInput,
  DnsResourceInput,
  ServerResourceInput,
  VpcResourceInput,
} from '~/resource/resource.model';
import { z } from 'zod';

export interface WorkspaceData {
  workspace: {
    id: string;
    subdomain: string;
    subscriptionId: number;
  };
  vpc: VpcResourceInput;
  server: ServerResourceInput;
  database: DatabaseResourceInput;
  dns: DnsResourceInput;
}

export const WorkspaceStatusSchema = z.nativeEnum(Status);
export type WorkspaceStatus = z.infer<typeof WorkspaceStatusSchema>;

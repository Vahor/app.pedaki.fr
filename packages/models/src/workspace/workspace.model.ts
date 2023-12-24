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
    name: string;
    maintenanceWindow: string;
  };
  vpc: VpcResourceInput;
  server: ServerResourceInput;
  database: DatabaseResourceInput;
  dns: DnsResourceInput;
}

export const WorkspaceStatusSchema = z.nativeEnum(Status);
export type WorkspaceStatus = z.infer<typeof WorkspaceStatusSchema>;

export const WorkspacePropertiesSchema = z.object({
  name: z.string().max(50),
  contactEmail: z.string().email(),
  contactName: z.string().max(128),
  logoUrl: z.string().url().max(1024),
  defaultLanguage: z.string().max(3),
  maintenanceWindow: z.string(), // TODO: add a regex to validate the format
  currentMaintenanceWindow: z.string().optional(), // TODO: add a regex to validate the format
});
export type WorkspaceProperties = z.infer<typeof WorkspacePropertiesSchema>;

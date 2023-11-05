import type { ServerProvider } from '@pedaki/models/resource/provider.model.js';
import type {
  DatabaseResourceInput,
  ResourceInput,
  ServerResourceInput,
} from '@pedaki/models/resource/resource.model.js';
import { serverFactory } from '@pedaki/pulumi/factory.js';
import { TRPCError } from '@trpc/server';

class ResourceService {
  private getProvider(providerName: ServerProvider) {
    const provider = serverFactory.getProvider(providerName);
    if (!provider) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `Provider ${providerName} not found` });
    }
    return provider;
  }

  async deleteStack({
    workspace,
    vpc,
    server,
    dns,
    database,
  }: {
    workspace: {
      identifier: string;
      subscriptionId: number;
    };
    vpc: ResourceInput;
    server: ServerResourceInput;
    database: DatabaseResourceInput;
    dns: null;
  }) {
    console.log(`Deleting stack for workspace '${workspace.identifier}'`);
    const provider = this.getProvider(vpc.provider);

    await provider.delete({
      identifier: workspace.identifier,
      region: vpc.region,
      server,
      database,
      dns,
    });

    return null;
  }

  async upsertStack({
    workspace,
    vpc,
    server,
    dns,
    database,
  }: {
    workspace: {
      identifier: string;
      subscriptionId: number;
    };
    vpc: ResourceInput;
    server: ServerResourceInput;
    database: DatabaseResourceInput;
    dns: null;
  }) {
    console.log(`Upserting stack for workspace '${workspace.identifier}'`);
    const provider = this.getProvider(vpc.provider);

    const outputs = await provider.create({
      identifier: workspace.identifier,
      region: vpc.region,
      server,
      database,
      dns,
    });

    console.log(outputs);

    return null;
  }
}

const resourceService = new ResourceService();
export { resourceService };

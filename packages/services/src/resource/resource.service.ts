import { prisma } from '@pedaki/db';
import type { ServerProvider } from '@pedaki/models/resource/provider.model.js';
import type {
  DatabaseResourceInput,
  DnsResourceInput,
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
    dns: DnsResourceInput;
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

  /**
   * The upsertStack function is responsible for creating a new stack in the cloud provider.
   * Or updating it if it already exists.
   *
   * This will also update the corresponding resource on our database.
   *
   * @param workspace Identify the workspace that is being created
   *  Used to link the resources in our database and the cloud provider
   *  The identifier is used as a prefix for the resources and as the subdomain for the DNS
   * @param vpc Customization for the VPC (region, provider, etc.)
   * @param server Customization for the servers (size, etc.)
   * @param dns Customization for the DNS (subdomain, etc.)
   * @param database Customization for the database (size, etc.)
   */
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
    dns: DnsResourceInput;
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

    console.log(`Stack upserted (provider) for workspace '${workspace.identifier}'`, outputs);

    // Upsert resource in prisma

    await prisma.$transaction([
      ...outputs.map(resource => {
        const { id, type, region, provider, ...data } = resource;

        const upsertData = {
          region: region,
          provider: provider,
          type: type,
          data: data,
        };

        return prisma.workspaceResource.upsert({
          where: {
            id: id,
          },
          create: {
            id: id,
            ...upsertData,
            subscription: {
              connect: {
                id: workspace.subscriptionId,
              },
            },
          },
          update: upsertData,
        });
      }),
    ]);

    return null;
  }
}

const resourceService = new ResourceService();
export { resourceService };

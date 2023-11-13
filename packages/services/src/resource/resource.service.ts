import { prisma } from '@pedaki/db';
import type { ServerProvider } from '@pedaki/models/resource/provider.model.js';
import type { WorkspaceData } from '@pedaki/models/workspace/workspace.model.js';
import { serverFactory } from '@pedaki/pulumi/factory.js';
import { TRPCError } from '@trpc/server';
import { backOff } from 'exponential-backoff';

class ResourceService {
  private getProvider(providerName: ServerProvider) {
    const provider = serverFactory.getProvider(providerName);
    if (!provider) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `Provider ${providerName} not found` });
    }
    console.log(`Using provider ${providerName}`);
    return provider;
  }

  async deleteStack({ workspace, vpc, server, dns, database }: WorkspaceData) {
    console.log(`Deleting stack for workspace '${workspace.identifier}'...`);
    const provider = this.getProvider(vpc.provider);

    await provider.delete({
      identifier: workspace.identifier,
      region: vpc.region,
      server,
      database,
      dns,
    });

    console.log(
      `Stack deleted (provider: ${vpc.provider}) for workspace '${workspace.identifier}'`,
    );

    console.log(`Deleting database resources for workspace '${workspace.identifier}'...`);
    const deleteResponse = await prisma.workspaceResource.deleteMany({
      where: {
        subscriptionId: workspace.subscriptionId,
      },
    });
    console.log(
      `Database resources deleted for workspace '${workspace.identifier}' (deleted: ${deleteResponse.count})`,
    );

    return null;
  }

  /**
   * Create a stack if it doesn't exist.
   * And retry if it fails.
   */
  async safeCreateStack({ workspace, vpc, server, dns, database }: WorkspaceData) {
    // First check that there is no resource with the same identifier
    const existingResource = await prisma.workspaceResource.count({
      where: {
        subscriptionId: workspace.subscriptionId,
      },
    });

    if (existingResource > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'stack_already_exists',
      });
    }

    await backOff(
      async () => {
        try {
          await this.upsertStack({ workspace, vpc, server, dns, database });
        } catch (error) {
          await this.deleteStack({ workspace, vpc, server, dns, database });
          throw error;
        }
      },
      {
        startingDelay: 60_000,
        numOfAttempts: 3,
        retry: (e, attempt) => {
          // TODO: handle error and cancel retry if it's not a retryable error
          console.error(e);
          console.log(`Retrying (${attempt}/3)...`);
          return true;
        },
      },
    );
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
  async upsertStack({ workspace, vpc, server, dns, database }: WorkspaceData) {
    console.log(`Upserting stack for workspace '${workspace.identifier}'...`);
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
    console.log(`Upserting database resources for workspace '${workspace.identifier}'...`);

    await prisma.$transaction([
      ...outputs.map(resource => {
        const { id, type, region, provider, ...data } = resource;

        const upsertData = {
          region: region,
          provider: provider,
          type: type,
          data: data,
          subscription: {
            connect: {
              id: workspace.subscriptionId,
            },
          },
        };

        return prisma.workspaceResource.upsert({
          where: {
            id: id,
          },
          create: {
            id: id,
            ...upsertData,
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

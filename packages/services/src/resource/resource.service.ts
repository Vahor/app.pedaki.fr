import { prisma } from '@pedaki/db';
import { logger } from '@pedaki/logger';
import type { ServerProvider } from '@pedaki/models/resource/provider.model.js';
import type { WorkspaceData } from '@pedaki/models/workspace/workspace.model.js';
import { ConcurrentUpdateError } from '@pedaki/pulumi/errors.js';
import { serverFactory } from '@pedaki/pulumi/factory.js';
import { TRPCError } from '@trpc/server';
import { workspaceService } from '~/workspace/workspace.service.js';
import { backOff } from 'exponential-backoff';

class ResourceService {
  async deleteStack({ workspace, vpc, server, dns, database }: WorkspaceData) {
    const profiler = logger.startTimer();
    logger.info(`Deleting stack for workspace '${workspace.subdomain}'...`);
    const provider = this.getProvider(vpc.provider);

    await provider.delete({
      workspace: {
        id: workspace.id,
        subdomain: workspace.subdomain,
      },
      region: vpc.region,
      server,
      database,
      dns,
    });

    logger.info(`Stack deleted (provider: ${vpc.provider}) for workspace '${workspace.subdomain}'`);

    logger.info(`Deleting database resources for workspace '${workspace.subdomain}'...`);
    const deleteResponse = await prisma.workspaceResource.deleteMany({
      where: {
        subscriptionId: workspace.subscriptionId,
      },
    });
    logger.info(
      `Database resources deleted for workspace '${workspace.subdomain}' (deleted: ${deleteResponse.count})`,
    );

    profiler.done({
      message: `Stack deleted for workspace '${workspace.subdomain}'`,
      data: { provider: vpc.provider },
    });

    return null;
  }

  /**
   * Create a stack if it doesn't exist.
   * And retry if it fails.
   */
  async safeCreateStack({ workspace, vpc, server, dns, database }: WorkspaceData) {
    logger.info(`Creating stack for workspace '${workspace.subdomain}'...`);
    // First check that there is no resource with the same subdomain
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

    let shouldDeleteStack = false;

    await backOff(
      async () => {
        if (shouldDeleteStack) {
          await this.deleteStack({ workspace, vpc, server, dns, database });
        }
        await this.upsertStack({ workspace, vpc, server, dns, database });
      },
      {
        startingDelay: 60_000,
        numOfAttempts: 4,
        retry: (e: Error, attempt) => {
          shouldDeleteStack = false;
          // TODO: handle error and cancel retry if it's not a retryable error
          logger.error({
            error: e,
            message: e.message,
            code: e.name,
          });
          logger.warn(`Retrying (${attempt}/4)...`);

          // ConcurrentUpdateError: code: -2
          if (e.name === ConcurrentUpdateError) {
            // There is already a stack being created, we just have to wait for it to finish
            return false;
          }
          shouldDeleteStack = true;
          return true;
        },
      },
    );

    // we expect the server to be created in the next 15 minutes
    setTimeout(
      () => {
        void workspaceService.updateExpectedStatus({
          workspaceId: workspace.id,
          status: 'ACTIVE',
          whereStatus: 'CREATING',
        });
      },
      15 * 60 * 1000,
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
    const profiler = logger.startTimer();
    logger.info(`Upserting stack for workspace '${workspace.subdomain}'...`);
    const provider = this.getProvider(vpc.provider);

    const outputs = await provider.create({
      workspace: {
        id: workspace.id,
        subdomain: workspace.subdomain,
      },
      region: vpc.region,
      server,
      database,
      dns,
    });

    logger.info(`Stack upserted (provider) for workspace '${workspace.subdomain}'`, outputs);

    // Upsert resource in prisma
    logger.info(`Upserting database resources for workspace '${workspace.subdomain}'...`);

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

    logger.info(`Database resources upserted for workspace '${workspace.subdomain}'`);

    profiler.done({
      message: `Stack upserted for workspace '${workspace.subdomain}'`,
      data: { provider: vpc.provider },
    });

    return null;
  }

  private getProvider(providerName: ServerProvider) {
    const provider = serverFactory.getProvider(providerName);
    if (!provider) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `Provider ${providerName} not found` });
    }
    logger.info(`Using provider ${providerName}`);
    return provider;
  }
}

const resourceService = new ResourceService();
export { resourceService };

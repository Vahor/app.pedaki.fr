import { SpanStatusCode, trace } from '@opentelemetry/api';
import { prisma } from '@pedaki/db';
import { logger } from '@pedaki/logger';
import type { ServerProvider } from '@pedaki/models/resource/provider.model.js';
import type { WorkspaceData } from '@pedaki/models/workspace/workspace.model.js';
import { ConcurrentUpdateError } from '@pedaki/pulumi/errors.js';
import { serverFactory } from '@pedaki/pulumi/factory.js';
import { TRPCError } from '@trpc/server';
import { workspaceService } from '~/workspace/workspace.service.js';
import { backOff } from 'exponential-backoff';
import { flatten } from 'flat';

class ResourceService {
  async deleteStack({ workspace, vpc, server, dns, database }: WorkspaceData) {
    const tracer = trace.getTracer('@pedaki/services');
    return tracer.startActiveSpan(
      `deleteStack - ${workspace.id} (${workspace.subdomain})`,
      async span => {
        span.setAttributes({
          workspaceId: workspace.id,
          provider: vpc.provider,
        });
        const provider = this.getProvider(vpc.provider);

        await provider.delete({
          workspace: {
            name: workspace.name,
            id: workspace.id,
            subdomain: workspace.subdomain,
          },
          region: vpc.region,
          server,
          database,
          dns,
        });

        const response = await prisma.workspaceResource.deleteMany({
          where: {
            subscriptionId: workspace.subscriptionId,
          },
        });

        span.setAttributes({
          deletedResources: response.count,
        });

        logger.info({
          message: `Deleted ${response.count} resources for workspace ${workspace.id}`,
          data: {
            workspaceId: workspace.id,
            subscriptionId: workspace.subscriptionId,
          },
        });

        span.end();

        return null;
      },
    );
  }

  /**
   * Create a stack if it doesn't exist.
   * And retry if it fails.
   */
  async safeCreateStack({ workspace, vpc, server, dns, database }: WorkspaceData) {
    const tracer = trace.getTracer('@pedaki/services');
    return tracer.startActiveSpan(
      `safeCreateStack - ${workspace.id} (${workspace.subdomain})`,
      async span => {
        span.setAttributes({
          workspaceId: workspace.id,
          provider: vpc.provider,
        });

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
              span.setAttributes(
                flatten({
                  attempt: {
                    [attempt]: {
                      error: e.message,
                      code: e.name,
                    },
                  },
                }),
              );
              span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });

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

        logger.info({
          message: `Created stack for workspace ${workspace.id}`,
          data: {
            workspaceId: workspace.id,
            subscriptionId: workspace.subscriptionId,
          },
        });

        span.end();
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
    const tracer = trace.getTracer('@pedaki/services');
    return tracer.startActiveSpan(
      `upsertStack - ${workspace.id} (${workspace.subdomain})`,
      async span => {
        span.setAttributes({
          workspaceId: workspace.id,
          provider: vpc.provider,
        });

        const provider = this.getProvider(vpc.provider);

        const outputs = await provider.create({
          workspace: {
            name: workspace.name,
            id: workspace.id,
            subdomain: workspace.subdomain,
          },
          region: vpc.region,
          server,
          database,
          dns,
        });

        span.setAttributes(
          flatten({
            createdResources: outputs,
          }),
        );

        // Upsert resource in prisma
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

        logger.info({
          message: `Created ${outputs.length} resources for workspace ${workspace.id}`,
          data: {
            workspaceId: workspace.id,
            subscriptionId: workspace.subscriptionId,
          },
        });

        span.end();
        return null;
      },
    );
  }

  private getProvider(providerName: ServerProvider) {
    const provider = serverFactory.getProvider(providerName);
    if (!provider) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `Provider ${providerName} not found` });
    }
    return provider;
  }
}

const resourceService = new ResourceService();
export { resourceService };

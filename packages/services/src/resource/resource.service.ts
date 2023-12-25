import type { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { prisma } from '@pedaki/db';
import { logger } from '@pedaki/logger';
import type { ServerProvider } from '@pedaki/models/resource/provider.model.js';
import type { WorkspaceData } from '@pedaki/models/workspace/workspace.model.js';
import { ConcurrentUpdateError } from '@pedaki/pulumi/errors.js';
import { serverFactory } from '@pedaki/pulumi/factory.js';
import {
  ENCRYPTED_BUCKET_NAME,
  FILES_BUCKET_NAME,
  s3Client,
  STATIC_BUCKET_NAME,
  workspacePrefix,
} from '@pedaki/pulumi/utils/aws.js';
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
            maintenanceWindow: workspace.maintenanceWindow,
          },
          region: vpc.region,
          server,
          database,
          dns,
        });

        await this.#cleanFilesBucket(FILES_BUCKET_NAME, workspace.id);
        await this.#cleanFilesBucket(ENCRYPTED_BUCKET_NAME, workspace.id);

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
            maintenanceWindow: workspace.maintenanceWindow,
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

        await this.#uploadBaseFiles(workspace.id);

        span.end();
        return null;
      },
    );
  }

  async #cleanFilesBucket(bucket: string, workspaceId: string) {
    const tracer = trace.getTracer('@pedaki/services');
    return tracer.startActiveSpan(`cleanFilesBucket - ${workspaceId} - ${bucket}`, async span => {
      span.setAttributes({
        workspaceId: workspaceId,
      });

      let count = 0;
      let response: ListObjectsV2CommandOutput | undefined;
      do {
        response = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: workspacePrefix(workspaceId),
          }),
        );

        const { Contents } = response;
        if (!Contents || Contents.length === 0) {
          break;
        }
        count += Contents.length;

        const objects = Contents.map(content => ({ Key: content.Key }));
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: objects,
            },
          }),
        );
      } while (response.IsTruncated);

      span.setAttributes({
        size: count,
      });
    });
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

        // we expect the server to be created in the next 5 minutes
        setTimeout(
          () => {
            void workspaceService.updateExpectedStatus({
              workspaceId: workspace.id,
              status: 'ACTIVE',
              whereStatus: 'CREATING',
            });
          },
          5 * 60 * 1000,
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

  async #uploadBaseFiles(workspaceId: string) {
    const tracer = trace.getTracer('@pedaki/services');
    return tracer.startActiveSpan(`uploadBaseFiles - ${workspaceId}`, async span => {
      span.setAttributes({
        workspaceId: workspaceId,
      });

      const copy_files = ['/logo/logo-192x192.png', '/logo/favicon-32x32.png'];

      for (const file of copy_files) {
        const newFile = `${workspacePrefix(workspaceId)}${file}`;
        const fromFileFull = `${STATIC_BUCKET_NAME}${file}`;
        const toFileFull = `${FILES_BUCKET_NAME}/${newFile}`;
        try {
          const exists = await s3Client.send(
            new HeadObjectCommand({
              Bucket: FILES_BUCKET_NAME,
              Key: newFile,
            }),
          );

          if (exists) {
            logger.info({
              message: `File ${toFileFull} already exists`,
            });
          }
        } catch (error) {
          if ((error as Error).name === 'NotFound') {
            await s3Client.send(
              new CopyObjectCommand({
                CopySource: fromFileFull,
                Bucket: FILES_BUCKET_NAME,
                Key: newFile,
                TaggingDirective: 'REPLACE',
                Tagging: 'public=true',
              }),
            );

            logger.info({
              message: `Copied file ${fromFileFull} to ${toFileFull}`,
            });
          } else {
            throw error;
          }
        }
      }
    });
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

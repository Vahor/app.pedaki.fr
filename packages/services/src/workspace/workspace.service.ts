import { generateToken } from '@pedaki/common/utils/random.js';
import { prisma } from '@pedaki/db';
import type { CreateWorkspaceInput } from '@pedaki/models/workspace/api-workspace.model.js';
import type { WorkspaceData, WorkspaceStatus } from '@pedaki/models/workspace/workspace.model.js';
import type { Prisma } from '@prisma/client';
import { ProductType } from '@prisma/client';

const WORKSPACE_CREATION_METADATA_VERSION = 1;

class WorkspaceService {
  getHealthStatusUrl(subdomain: string) {
    return `${this.getWorkspaceUrl(subdomain)}/api/health`;
  }

  getWorkspaceUrl(subdomain: string) {
    return `https://${subdomain}.pedaki.fr`;
  }

  getDomainName(subdomain: string) {
    return `${subdomain}.pedaki.fr`;
  }

  /**
   * Mark a workspace as deleted, this will not delete the workpace.
   * The column `deletedAt` will be set to the current date.
   * @param subdomain the workspace subdomain
   */
  async deleteWorkspaceBySubdomain(subdomain: string): Promise<boolean> {
    console.log(`Deleting workspace '${subdomain}'`);
    try {
      await prisma.workspace.update({
        where: {
          subdomain,
        },
        data: {
          subdomain: null,
          deletedAt: new Date(),
        },
        select: {
          id: true,
        },
      });
      return true;
    } catch (error) {
      console.error(`Workspace '${subdomain}' not found`);
      return false;
    }
  }

  async getLatestSubscriptionId(subdomain: string): Promise<number | null> {
    console.log(`Getting latest subscription id for workspace '${subdomain}'`);
    const subscription = await prisma.workspaceSubscription.findFirst({
      where: {
        workspace: {
          subdomain,
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    });
    console.log('DEBUG: subscription', subscription);
    return subscription?.id ?? null;
  }

  async createWorkspace({
    workspace,
    subscription,
  }: {
    workspace: Pick<CreateWorkspaceInput, 'name' | 'subdomain'> & {
      billing: Pick<CreateWorkspaceInput['billing'], 'name' | 'email'>;
    } & {
      creationData: Omit<WorkspaceData, 'workspace' | 'server'> & {
        server: Omit<WorkspaceData['server'], 'environment_variables'>;
      };
    };
    subscription: {
      customerId: string;
      subscriptionId: string;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
    };
  }): Promise<{ workspaceId: string; subscriptionId: number; authToken: string }> {
    console.log(`Creating workspace (database) '${workspace.subdomain}'...`);
    const { id, subscriptions } = await prisma.workspace.create({
      data: {
        name: workspace.name,
        subdomain: workspace.subdomain,
        billingEmail: workspace.billing.email,
        billingName: workspace.billing.name,
        stripeCustomerId: subscription.customerId,
        members: {
          create: {
            email: workspace.billing.email,
          },
        },
        subscriptions: {
          create: [
            {
              type: ProductType.HOSTING,
              stripeSubscriptionId: subscription.subscriptionId,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              workspaceCreationData: {
                version: WORKSPACE_CREATION_METADATA_VERSION,
                ...workspace.creationData,
              } as Prisma.JsonObject,
            },
          ],
        },
      },
      select: {
        id: true,
        subscriptions: {
          select: {
            id: true,
          },
        },
      },
    });
    const subscriptionId = subscriptions[0]!.id;

    console.log('Updating workspace creation data on subscription and generating token...');
    // Create token for the workspace
    const token = await this.registerNewWorkspaceToken({ workspaceId: id });

    // Update subscription
    await prisma.workspaceSubscription.update({
      where: {
        id: subscriptionId,
      },
      data: {
        workspaceCreationData: {
          version: WORKSPACE_CREATION_METADATA_VERSION,
          ...workspace.creationData,
          workspace: {
            subdomain: workspace.subdomain,
            subscriptionId,
          },
        } as Prisma.JsonObject,
      },
    });

    return { workspaceId: id, subscriptionId, authToken: `${id}:${token}` };
  }

  async registerNewWorkspaceToken({ workspaceId }: { workspaceId: string }) {
    console.log(`Registering new workspace token (database) '${workspaceId}'...`);
    const token = this.#generateAuthToken();
    await prisma.workspaceToken.create({
      data: {
        token,
        workspace: {
          connect: {
            id: workspaceId,
          },
        },
      },
    });
    return token;
  }

  async deleteOldWorkspaceTokens({ workspaceId }: { workspaceId: string }) {
    // TODO: call this method once the server is up and running
    console.log(`Deleting old workspace tokens (database) '${workspaceId}'...`);

    const mostRecentToken = await prisma.workspaceToken.findFirst({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    });

    if (!mostRecentToken) {
      console.log(`No token found for workspace '${workspaceId}'`);
      return;
    }

    const response = await prisma.workspaceToken.deleteMany({
      where: {
        workspaceId,
        NOT: {
          id: mostRecentToken.id,
        },
      },
    });

    console.log(`Deleted ${response.count} old workspace tokens`);
  }

  async getWorkspaceId(subdomain: string) {
    console.log(`Getting workspace id for workspace '${subdomain}'`);
    const workspace = await prisma.workspace.findUnique({
      where: {
        subdomain,
      },
      select: {
        id: true,
      },
    });
    if (!workspace) {
      throw new Error(`Workspace '${subdomain}' not found`);
    }
    return workspace.id;
  }

  async updateWorkspaceSubscriptionStripeData({
    subscriptionId,
    currentPeriodStart,
    currentPeriodEnd,
    endedAt,
    cancelAt,
    canceledAt,
  }: {
    subscriptionId: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    endedAt: Date | null;
    cancelAt: Date | null;
    canceledAt: Date | null;
  }) {
    console.log(`Updating workspace subscription '${subscriptionId}'...`);
    await prisma.workspaceSubscription.update({
      where: {
        id: subscriptionId,
      },
      data: {
        currentPeriodStart,
        currentPeriodEnd,
        endedAt,
        cancelAt,
        canceledAt,
      },
    });
  }

  async updateCurrentStatus({ subdomain, status }: { subdomain: string; status: WorkspaceStatus }) {
    console.log(`Updating workspace status '${subdomain}'...`);

    await prisma.workspace.update({
      where: {
        subdomain: subdomain,
      },
      data: {
        currentStatus: status,
      },
    });
  }

  #generateAuthToken() {
    return generateToken();
  }
}

const workspaceService = new WorkspaceService();
export { workspaceService };

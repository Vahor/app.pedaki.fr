import { prisma } from '@pedaki/db';
import { DOCKER_IMAGE } from '@pedaki/pulumi/utils/docker.js';
import { resourceService } from '@pedaki/services/resource/resource.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';

const WORKSPACE_IDENTIFIER = 'demo';

const BASE_PARAMETERS = {
  identifier: WORKSPACE_IDENTIFIER,
  vpc: {
    provider: 'aws',
    region: 'eu-west-3',
  },
  server: {
    size: 'small',
    environment_variables: {
      IS_DEMO: 'true',
    },
  },
  database: {
    size: 'small',
  },
  dns: {
    subdomain: 'demo',
  },
  workspace: {
    identifier: WORKSPACE_IDENTIFIER,
  },
} as const;

const stackParameters = (subscriptionId: number) => ({
  ...BASE_PARAMETERS,
  workspace: {
    ...BASE_PARAMETERS.workspace,
    subscriptionId,
  },
});

const main = async () => {
  console.log("Starting cron 'cron-demo-community'");
  console.log(`This will use the ${DOCKER_IMAGE} docker image`);
  await prisma.$connect();

  const previousSubscriptionId =
    await workspaceService.getLatestSubscriptionId(WORKSPACE_IDENTIFIER);

  let subscriptionId: number;

  if (previousSubscriptionId) {
    console.log(`Deleting previous stack for subscription ${previousSubscriptionId}`);
    await resourceService.deleteStack(stackParameters(previousSubscriptionId));
    subscriptionId = previousSubscriptionId;

    // TODO: renew subscription and update resources
  } else {
    console.log('No previous subscription found, creating a new one');
    const { subscriptionId: newSubscriptionId } = await workspaceService.createWorkspace({
      workspace: {
        creationData: BASE_PARAMETERS,
        identifier: WORKSPACE_IDENTIFIER,
        email: 'developers@pedaki.fr',
        name: 'Demo',
      },
      subscription: {
        subscriptionId: 'sub_00000000000000',
        customerId: 'cus_00000000000000',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      },
    });
    subscriptionId = newSubscriptionId;
  }

  await resourceService.upsertStack(stackParameters(subscriptionId));

  console.log("Finished cron 'cron-demo-community'");
};
void main()
  .catch(console.error)
  .finally(() => void prisma.$disconnect())
  .then(() => {
    console.log("Exiting cron 'cron-demo-community'");
  });

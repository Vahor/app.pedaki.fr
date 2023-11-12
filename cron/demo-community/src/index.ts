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
  await prisma.$connect();
  console.log(`This will use the ${DOCKER_IMAGE} docker image`);
  await workspaceService.deleteWorkspaceByIdentifier(WORKSPACE_IDENTIFIER);
  const previousSubscriptionId =
    await workspaceService.getLatestSubscriptionId(WORKSPACE_IDENTIFIER);

  if (previousSubscriptionId)
    await resourceService.deleteStack(stackParameters(previousSubscriptionId));

  const { subscriptionId } = await workspaceService.createWorkspace({
    workspace: {
      creationData: BASE_PARAMETERS,
      identifier: 'demo',
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

  await resourceService.upsertStack(stackParameters(subscriptionId));

  console.log("Finished cron 'cron-demo-community'");
};
void main()
  .catch(console.error)
  .finally(() => void prisma.$disconnect())
  .then(() => {
    console.log("Exiting cron 'cron-demo-community'");
  });
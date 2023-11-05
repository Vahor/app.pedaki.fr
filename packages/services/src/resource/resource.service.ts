import type { ServerProvider } from '@pedaki/models/resource/provider.model.js';
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

  // async createStack(
  //     subscriptionId: string,
  //   {
  //     workspaceId,
  //     stackParameters,
  //   }: {
  //     subscriptionId: string;
  //     workspaceId: string;
  //     stackParameters: Pick<ServerResource, 'd' | 'region'>;
  //   },
  // ) {
  //   const providerInstance = this.getProvider(provider);
  //
  //   const outputs = await provider.create({
  //     workspaceId: workspaceId,
  //     region: stackParameters.region,
  //     size: stackParameters.size,
  //   });
  //
  //   return null;
  // }
}

const resourceService = new ResourceService();
export { resourceService };

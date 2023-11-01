import type {Provider} from '@pedaki/schema/region.model.ts';
import {AwsServerProvider} from './stack/aws/provider.ts';
import {TestServerProvider} from './stack/mock/provider.ts';
import type {ServerProvider} from './type.ts';

const providers = {
    AWS: new AwsServerProvider(),
    test: new TestServerProvider(),
} as const;

class ServerProviderFactory {
    public getProvider<P extends Provider>(provider: P): ServerProvider<P> {
        return providers[provider] as ServerProvider<P>;
    }
}

const serverFactory = new ServerProviderFactory();
export {serverFactory};

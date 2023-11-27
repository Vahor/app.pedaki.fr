import { BaselimeSDK } from '@baselime/node-opentelemetry';
import { env } from '~/env.ts';

export const initTelemetry = (instrumentations: any[]) => {
  const sdk = new BaselimeSDK({
    baselimeKey: env.BASELIME_API_KEY,
    service: env.LOGGER_SERVICE_NAME,
    instrumentations: instrumentations,
  });

  const provider = sdk.start();

  provider.resource.attributes['service.name'] = env.LOGGER_SERVICE_NAME;
  provider.resource.attributes['service.namespace'] = env.LOGGER_NAMESPACE;
};

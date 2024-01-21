import type { Attributes } from '@opentelemetry/api';
import { trace } from '@opentelemetry/api';
import { VERSION } from '@pedaki/logger/version.js';
import * as random from '@pulumi/random';
import { env } from '~/env.ts';
import type { StackOutputs, StackOutputsLike } from '~/output.ts';
import { StackOutputsSchema } from '~/output.ts';
import type { StackParameters, StackProvider } from '~/type.ts';
import { redacted } from '~/utils/redacted.ts';
import { flatten } from 'flat';
import { PulumiUtils } from '../shared.ts';
import * as backend from './resources/backend.ts';
import * as domain from './resources/domain.ts';
import * as frontend from './resources/frontend.ts';
import * as iam from './resources/iam.ts';
import * as key from './resources/key.ts';
import * as network from './resources/network.ts';
import * as secrets from './resources/secrets.ts';

const telemetryAttributes = (params: StackParameters<'aws'>): Attributes =>
  flatten({
    workspaceId: params.workspace.id,
    provider: 'aws',
    aws: {
      region: params.region,
    },
  });

export class AwsServerProvider implements StackProvider<'aws'> {
  public async create(params: StackParameters<'aws'>): Promise<StackOutputs> {
    const tracer = trace.getTracer('@pedaki/pulumi');
    return tracer.startActiveSpan(
      `create with aws - ${params.workspace.id} (${params.dns.subdomain})`,
      async span => {
        span.setAttributes(telemetryAttributes(params));

        const stack = await PulumiUtils.createOrSelectStack(
          params.workspace.id,
          this.program(params),
        );
        await stack.setConfig('aws:region', { value: params.region });

        const tags = this.tags(params);
        await Promise.all(Object.entries(tags).map(([key, value]) => stack.setTag(key, value)));

        const upRes = await stack.up();

        // Pulumi transform the array into an object {0: {value: ...}, 1: {value: ...}, ...}
        const formattedOutputs = Object.values(upRes.outputs).reduce((acc, output) => {
          acc.push(output.value);
          return acc;
        }, [] as unknown[]);

        const response = StackOutputsSchema.parse(formattedOutputs);

        span.end();
        return response;
      },
    );
  }

  public async delete(params: StackParameters<'aws'>): Promise<void> {
    const tracer = trace.getTracer('@pedaki/pulumi');
    return tracer.startActiveSpan(
      `delete with aws - ${params.workspace.id} (${params.dns.subdomain})`,
      async span => {
        span.setAttributes(telemetryAttributes(params));
        await PulumiUtils.deleteStack(params.workspace.id, this.program(params));
        span.end();
      },
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private program = (params: StackParameters<'aws'>) => async (): Promise<StackOutputsLike> => {
    const tags = this.tags(params);

    const user = new iam.InstanceProfile(`${params.workspace.id}-user`, {
      tags,
      stackParameters: params,
    });

    // Create vpc for the whole stack
    const vpc = new network.Vpc(`${params.workspace.id}-net`, {
      stackParameters: params,
      tags,
    });

    const dbPassword = new random.RandomPassword(`${params.workspace.id}-db-password`, {
      length: 32,
      special: true,
      overrideSpecial: '_',
    }).result;

    const db = new backend.Db(
      `${params.workspace.id}-db`,
      {
        dbName: 'pedaki',
        dbUser: 'pedakiuser',
        dbPassword: dbPassword,
        subnetIds: vpc.subnetIds,
        securityGroupIds: vpc.rdsSecurityGroupIds,
        dbPort: vpc.ports.mysql,
        stackParameters: params,
        tags,
      },
      {
        dependsOn: [vpc],
      },
    );

    // Keys generation
    const encryptionKey = new key.EncryptionKey(`${params.workspace.id}-encryption-key`, {}, {});
    const passwordSalt = new random.RandomPassword(`${params.workspace.id}-password-salt`, {
      length: 32,
      special: true,
      overrideSpecial: '_',
    });
    const authSecret = new key.EncryptionKey(`${params.workspace.id}-auth-secret`);
    const apiSecret = new key.EncryptionKey(`${params.workspace.id}-api-secret`);

    const secret = new secrets.Secrets(
      `${params.workspace.id}-secrets`,
      {
        db: {
          host: db.host,
          name: db.name,
          user: db.user,
          password: db.password,
          port: db.port,
          encryptionKey: encryptionKey.key,
        },
        auth: {
          passwordSalt: passwordSalt.result,
          authSecret: authSecret.key,
        },
        pedaki: {
          name: params.workspace.name,
          subdomain: params.workspace.subdomain,
          workspaceId: params.workspace.id,
          authToken: params.server.environment_variables.PEDAKI_AUTH_TOKEN,
          host: `${params.workspace.subdomain}.pedaki.fr`,
          version: VERSION,
          apiSecret: apiSecret.key,
        },
        environment_variables: params.server.environment_variables,
        tags,
        stackParameters: params,
      },
      {
        dependsOn: [db, encryptionKey, passwordSalt, authSecret],
      },
    );

    // Create an EC2 instance
    const server = new frontend.WebService(
      `${params.workspace.id}-frontend`,
      {
        instanceProfileArn: user.name,
        secrets: secret,
        vpc: {
          subnetIds: vpc.subnetIds,
          securityGroupIds: vpc.feSecurityGroupIds,
        },
        stackParameters: params,
        tags,
      },
      {
        dependsOn: [db, encryptionKey, passwordSalt, authSecret],
      },
    );

    // Add cloudflare dns
    const dns = new domain.Domain(
      `${params.workspace.id}-dns`,
      {
        publicIp: server.publicIp,
        stackParameters: params,
        tags,
      },
      {
        dependsOn: [server],
      },
    );

    return [
      {
        type: 'server',
        provider: 'aws',
        id: server.arn,
        region: params.region,
        size: params.server.size,
        environment_variables: redacted(params.server.environment_variables),
      },
      {
        type: 'database',
        provider: 'aws',
        id: db.arn,
        region: params.region,
        size: params.database.size,
      },
      {
        type: 'dns',
        provider: 'cloudflare',
        id: dns.id,
        region: null,
        subdomain: params.dns.subdomain,
        value: dns.value,
      },
    ];
  };

  private tags = (params: StackParameters<'aws'>) => ({
    'pedaki:subdomain': params.workspace.subdomain,
    'pedaki:workspace': params.workspace.id,
    'pedaki:environment': env.NODE_ENV,
  });
}

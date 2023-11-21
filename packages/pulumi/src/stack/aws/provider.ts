import * as random from '@pulumi/random';
import type { StackOutputs, StackOutputsLike } from '~/output.ts';
import { StackOutputsSchema } from '~/output.ts';
import type { StackParameters, StackProvider } from '~/type.ts';
import { redacted } from '~/utils/redacted.ts';
import { PulumiUtils } from '../shared.ts';
import * as backend from './resources/backend.ts';
import * as domain from './resources/domain.ts';
import * as frontend from './resources/frontend.ts';
import * as key from './resources/key.ts';
import * as network from './resources/network.ts';

export class AwsServerProvider implements StackProvider<'aws'> {
  public async create(params: StackParameters<'aws'>): Promise<StackOutputs> {
    const stack = await PulumiUtils.createOrSelectStack(params.workspace.id, this.program(params));
    await stack.setConfig('aws:region', { value: params.region });

    const tags = this.tags(params);
    await Promise.all(Object.entries(tags).map(([key, value]) => stack.setTag(key, value)));

    console.log(`Creating/updating stack '${params.workspace.id}'...`);
    const upRes = await stack.up();

    // Pulumi transform the array into an object {0: {value: ...}, 1: {value: ...}, ...}
    const formattedOutputs = Object.values(upRes.outputs).reduce((acc, output) => {
      acc.push(output.value);
      return acc;
    }, [] as unknown[]);

    return StackOutputsSchema.parse(formattedOutputs);
  }

  public async delete(params: StackParameters<'aws'>): Promise<void> {
    await PulumiUtils.deleteStack(params.workspace.id, this.program(params));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private program = (params: StackParameters<'aws'>) => async (): Promise<StackOutputsLike> => {
    const tags = this.tags(params);

    // Create vpc for the whole stack
    const vpc = new network.Vpc(`${params.workspace.id}-net`, {
      stackParameters: params,
      tags,
    });

    const dbPassword = new random.RandomPassword(`${params.workspace.id}-db-password`, {
      length: 32,
      special: true,
      overrideSpecial: '_%',
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
    const encryptionKey = new key.EncryptionKey(`${params.workspace.id}-encryption-key`);
    const passwordSalt = new key.EncryptionKey(`${params.workspace.id}-password-salt`);
    const authSecret = new key.EncryptionKey(`${params.workspace.id}-auth-secret`);

    // Create an EC2 instance
    const server = new frontend.WebService(
      `${params.workspace.id}-frontend`,
      {
        dbHost: db.host,
        dbPort: db.port,
        dbName: db.name,
        dbUser: db.user,
        dbPassword: db.password,
        dbEncryptionKey: encryptionKey.key,
        passwordSalt: passwordSalt.key,
        authSecret: authSecret.key,
        vpcId: vpc.vpcId,
        subnetIds: vpc.subnetIds,
        securityGroupIds: vpc.feSecurityGroupIds,
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
  });
}

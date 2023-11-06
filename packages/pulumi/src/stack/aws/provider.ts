import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';
import type { StackOutputs, StackParameters, StackProvider } from '~/type.ts';
import { PulumiUtils } from '../shared.ts';
import * as backend from './resources/backend.ts';
import * as dns from './resources/dns.ts';
import * as frontend from './resources/frontend.ts';
import * as network from './resources/network.ts';

export class AwsServerProvider implements StackProvider<'aws'> {
  public async create(params: StackParameters<'aws'>): Promise<StackOutputs> {
    const stack = await PulumiUtils.createOrSelectStack(params.identifier, this.program(params));
    const tags = this.tags(params);
    Object.entries(tags).forEach(([key, value]) => stack.setTag(key, value));

    const upRes = await stack.up({ onOutput: console.info });

    // TODO: throw error if the output are not valid (use zod ?)
    return {
      machinePublicIp: upRes.outputs.machinePublicIp!.value as string,
      publicHostName: upRes.outputs.publicHostName!.value as string,
    };
  }

  public async delete(params: StackParameters<'aws'>): Promise<void> {
    await PulumiUtils.deleteStack(params.identifier, this.program(params));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private program = (params: StackParameters<'aws'>) => async () => {
    const tags = this.tags(params);

    // Create vpc for the whole stack
    const vpc = new network.Vpc(`${params.identifier}-net`, {
      stackParameters: params,
      tags,
    });

    const dbPassword = new random.RandomPassword(`${params.identifier}-db-password`, {
      length: 32,
      special: true,
      overrideSpecial: '_%',
    }).result;

    const db = new backend.Db(`${params.identifier}-db`, {
      dbName: 'pedaki',
      dbUser: 'pedakiuser',
      dbPassword: dbPassword,
      subnetIds: vpc.subnetIds,
      securityGroupIds: vpc.rdsSecurityGroupIds,
      dbPort: vpc.ports.mysql,
      stackParameters: params,
      tags,
    });

    // Create an EC2 instance
    const server = new frontend.WebService(`${params.identifier}-frontend`, {
      dbHost: db.dbHost,
      dbPort: db.dbPort,
      dbName: db.dbName,
      dbUser: db.dbUser,
      dbPassword: db.dbPassword,
      vpcId: vpc.vpcId,
      subnetIds: vpc.subnetIds,
      securityGroupIds: vpc.feSecurityGroupIds,
      stackParameters: params,
      tags,
    });

    // Add cloudflare dns
    new dns.Dns(`${params.identifier}-dns`, {
      publicIp: server.publicIp,
      stackParameters: params,
      tags,
    });

    // TODO: change variable names
    return {
      machinePublicIp: server.publicIp,
      publicHostName: pulumi.interpolate`http://${server.dnsName}`,
      dbHost: db.dbHost,
      dbPort: db.dbPort,
      ...tags,
    };
  };

  private tags = (params: StackParameters<'aws'>) => ({
    'pedaki:identifier': params.identifier,
  });
}

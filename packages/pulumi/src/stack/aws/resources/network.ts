import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import type { StackParameters } from '~/type.ts';

export interface VpcArgs {
  cidrBlock?: string;
  instanceTenancy?: string;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
  stackParameters: StackParameters<'aws'>;
  tags: Record<string, string>;
}

export class Vpc extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly subnetIds: pulumi.Output<string>[];
  public readonly rdsSecurityGroupIds: pulumi.Output<string>[];
  public readonly feSecurityGroupIds: pulumi.Output<string>[];
  public readonly ports: { http: 80; https: 443; mysql: number };
  public readonly subnetGroup: aws.rds.SubnetGroup;

  constructor(name: string, args: VpcArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:resource:Vpc', name, args, opts);

    const cidrBlock = args.cidrBlock ?? '10.100.0.0/16';
    const instanceTenancy = args.instanceTenancy ?? 'default';
    const enableDnsHostnames = args.enableDnsHostnames ?? true;
    const enableDnsSupport = args.enableDnsSupport ?? true;

    this.ports = {
      http: 80,
      https: 443,
      mysql: 3306,
    };

    const vpcName = `${name}-vpc`;
    const vpc = new aws.ec2.Vpc(
      vpcName,
      {
        cidrBlock: cidrBlock,
        instanceTenancy: instanceTenancy,
        enableDnsHostnames: enableDnsHostnames,
        enableDnsSupport: enableDnsSupport,
        tags: {
          ...args.tags,
          Name: vpcName,
        },
      },
      { parent: this },
    );

    const igwName = `${name}-igw`;
    const igw = new aws.ec2.InternetGateway(
      igwName,
      {
        vpcId: vpc.id,
        tags: {
          ...args.tags,
          Name: igwName,
        },
      },
      { parent: this },
    );

    const rtName = `${name}-rt`;
    const routeTable = new aws.ec2.RouteTable(
      rtName,
      {
        vpcId: vpc.id,
        tags: {
          ...args.tags,
          Name: rtName,
        },
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
          },
        ],
      },
      { parent: this },
    );

    // Subnets, at least across two zones
    const allZones = aws
      .getAvailabilityZones({
        state: 'available',
        filters: [
          {
            name: 'region-name',
            values: [args.stackParameters.region],
          },
        ],
      })
      .then(azs => azs.names);

    // Limit to two zones
    const subnetsIds: pulumi.Output<string>[] = [];
    const subnetBaseName = `${name}-subnet`;
    for (let i = 0; i < 2; i++) {
      const az = allZones.then(zones => zones[i]!);
      const subnetName = `${subnetBaseName}-${i}`;
      const subnet = new aws.ec2.Subnet(
        subnetName,
        {
          assignIpv6AddressOnCreation: false, // Don't need IPv6
          vpcId: vpc.id,
          mapPublicIpOnLaunch: true,
          cidrBlock: `10.100.${subnetsIds.length}.0/24`,
          availabilityZone: az,
          tags: {
            ...args.tags,
            Name: subnetName,
          },
        },
        { parent: this },
      );

      const _ = new aws.ec2.RouteTableAssociation(
        `${subnetBaseName}-${i}-rta`,
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        },
        { parent: this },
      );

      subnetsIds.push(subnet.id);
    }

    const ec2SgName = `${name}-ec2-secgrp`;
    const ec2Sg = new aws.ec2.SecurityGroup(
      ec2SgName,
      {
        vpcId: vpc.id,
        description: 'Allow HTTPS/HTTP access',
        tags: {
          ...args.tags,
          Name: ec2SgName,
        },
        revokeRulesOnDelete: true,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: this.ports.https,
            toPort: this.ports.https,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS',
          }, // HTTPS
          {
            protocol: 'tcp',
            fromPort: this.ports.http,
            toPort: this.ports.http,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP',
          }, // HTTPS
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }, // All
        ],
      },
      { parent: this },
    );

    const rdsSgName = `${name}-rds-secgrp`;
    const rdsSg = new aws.ec2.SecurityGroup(rdsSgName, {
      vpcId: vpc.id,
      description: 'Allow MySQL access',
      tags: {
        ...args.tags,
        Name: rdsSgName,
      },
      revokeRulesOnDelete: true,
    });
    const _ = new aws.ec2.SecurityGroupRule(`${name}-rds-secgrp-ingress`, {
      type: 'ingress',
      fromPort: this.ports.mysql,
      toPort: this.ports.mysql,
      protocol: 'tcp',
      securityGroupId: rdsSg.id,
      sourceSecurityGroupId: ec2Sg.id,
    });

    const subnetGroupName = `${name}-subnet-group`;
    const subnetGroup = new aws.rds.SubnetGroup(subnetGroupName, {
      subnetIds: subnetsIds,
      tags: {
        ...args.tags,
        Name: subnetGroupName,
      },
    });

    this.vpcId = vpc.id;
    this.subnetIds = subnetsIds;
    this.subnetGroup = subnetGroup;
    this.rdsSecurityGroupIds = [rdsSg.id];
    this.feSecurityGroupIds = [ec2Sg.id];

    this.registerOutputs({});
  }
}
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import type {StackParameters} from "~/type.ts";

export interface WebServiceArgs {
  dbHost: pulumi.Output<string>;
  dbName: pulumi.Output<string>;
  dbUser: pulumi.Output<string>;
  dbPassword: pulumi.Output<string | undefined>;
  dbPort: pulumi.Output<number>;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string>[];
  securityGroupIds: pulumi.Output<string>[];
  tags: Record<string, string>;
  stackParameters: StackParameters<'AWS'>;
}

// Creates DB
export class WebService extends pulumi.ComponentResource {
  public readonly dnsName: pulumi.Output<string>;
  public readonly publicIp: pulumi.Output<string>;

  constructor(name: string, args: WebServiceArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:resource:WebService', name, args, opts);

    // Get the ID for the latest Amazon Linux AMI
    const amiId = aws.ec2
      .getAmi({
        owners: ['amazon'],
        mostRecent: true,
        filters: [
          { name: 'state', values: ['available'] },
          { name: 'name', values: ['amzn-ami-hvm-*-x86_64-ebs'] },
        ],
      })
      .then(ami => ami.id);

    const ec2Name = `${name}-ec2`;
    const ec2 = new aws.ec2.Instance(
      ec2Name,
      {
        instanceType: this.ec2InstanceType(args.stackParameters.size),
        vpcSecurityGroupIds: args.securityGroupIds,
        subnetId: args.subnetIds[0],
        ami: amiId,
        userData: this.startScript(args),
        userDataReplaceOnChange: true, // Force to recreate the ec2 instance when the script changes
        tags: {
          ...args.tags,
          Name: ec2Name,
        },
      },
      { parent: this },
    );

    this.dnsName = ec2.publicDns;
    this.publicIp = ec2.publicIp;

    this.registerOutputs({});
  }

  private startScript = (args: WebServiceArgs) => {
    return pulumi.interpolate`#!/bin/bash
        yum install -y mysql
        DATABASES=$(mysql -h ${args.dbHost} -P ${args.dbPort} -u ${args.dbUser} -p${args.dbPassword} -e "SHOW DATABASES;")
        echo "Hello, Shrek! The time is $(date -R)! RDSEndpoint: ${args.dbHost}, RDS Port: ${args.dbPort}, User: ${args.dbUser}, Password: ${args.dbPassword}, Databases: $DATABASES" > index.html
        nohup python -m SimpleHTTPServer 80 &`;
  };

  private ec2InstanceType = (size: StackParameters<'AWS'>['size']) => {
    switch (size) {
      case 'small':
        return 't3a.micro';
    }
  };
}

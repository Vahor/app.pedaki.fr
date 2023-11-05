import { rds } from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import type { StackParameters } from '~/type.ts';

export interface DbArgs {
  dbName: string;
  dbUser: string;
  dbPassword: pulumi.Output<string>;
  dbPort: number;
  subnetIds: pulumi.Output<string>[];
  securityGroupIds: pulumi.Output<string>[];
  tags: Record<string, string>;
  stackParameters: StackParameters<'aws'>;
}

export class Db extends pulumi.ComponentResource {
  public readonly dbHost: pulumi.Output<string>;
  public readonly dbName: pulumi.Output<string>;
  public readonly dbUser: pulumi.Output<string>;
  public readonly dbPassword: pulumi.Output<string | undefined>;
  public readonly dbPort: pulumi.Output<number>;

  constructor(name: string, args: DbArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:resource:DB', name, args, opts);

    const rdsSubnetGroupName = `${name}-sng`;
    const rdsSubnetGroup = new rds.SubnetGroup(
      rdsSubnetGroupName,
      {
        subnetIds: args.subnetIds,
        tags: {
          ...args.tags,
          Name: rdsSubnetGroupName,
        },
      },
      { parent: this },
    );

    // RDS DB
    const rdsName = `${name}-rds`;
    const db = new rds.Instance(
      rdsName,
      {
        dbName: args.dbName,
        username: args.dbUser,
        password: args.dbPassword,
        vpcSecurityGroupIds: args.securityGroupIds,
        dbSubnetGroupName: rdsSubnetGroup.name,
        allocatedStorage: 20,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: this.instanceClass(args.stackParameters.database.size),
        storageType: 'gp2',
        skipFinalSnapshot: true,
        publiclyAccessible: false,
        copyTagsToSnapshot: true,
        deleteAutomatedBackups: true,
        port: args.dbPort,
        multiAz: false, // TODO: make this configurable, 2x price at least
        maintenanceWindow: 'SAT:02:00-SAT:05:00', // TODO: add this in the docs,
        tags: {
          ...args.tags,
          Name: rdsName,
        },
      },
      { parent: this },
    );

    this.dbHost = db.address;
    this.dbName = db.dbName;
    this.dbUser = db.username;
    this.dbPassword = db.password;
    this.dbPort = db.port;

    this.registerOutputs({});
  }

  private instanceClass = (size: StackParameters<'aws'>['database']['size']) => {
    switch (size) {
      case 'small':
        return 'db.t2.micro';
    }
  };
}

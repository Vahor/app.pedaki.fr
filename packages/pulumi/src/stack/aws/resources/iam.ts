import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { prefixWithSlash } from '~/stack/constants.ts';
import type { StackParameters } from '~/type.ts';

export interface IamArgs {
  tags: Record<string, string>;
  stackParameters: StackParameters<'aws'>;
}

export class InstanceProfile extends pulumi.ComponentResource {
  public readonly name: pulumi.Output<string>;
  public readonly arn: pulumi.Output<string>;

  constructor(name: string, args: IamArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:resource:Iam', name, args, opts);

    const role = new aws.iam.Role(
      `${args.stackParameters.workspace.id}-role`,
      {
        name: `${args.stackParameters.workspace.id}-role`,
        assumeRolePolicy: {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'IamAssumeRole',
              Action: 'sts:AssumeRole',
              Principal: {
                // Can be used only by an ec2 instance
                Service: 'ec2.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        },
        tags: args.tags,
      },
      {
        parent: this,
      },
    );

    const policy = new aws.iam.Policy(
      `${args.stackParameters.workspace.id}-policy`,
      {
        name: `${args.stackParameters.workspace.id}-policy`,
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'ReadParameterStore',
              Action: ['ssm:GetParameters'],
              Effect: 'Allow',
              Resource: [
                `arn:aws:ssm:*:*:parameter/${prefixWithSlash}${args.stackParameters.workspace.id}*`,
                `arn:aws:ssm:*:*:parameter/shared/*`,
              ],
            },
          ],
        },
        tags: args.tags,
      },
      {
        parent: this,
      },
    );

    const _ = new aws.iam.RolePolicyAttachment(
      `${args.stackParameters.workspace.id}-policy-attachment`,
      {
        role: role.name,
        policyArn: policy.arn,
      },
      {
        parent: this,
      },
    );

    const instanceProfile = new aws.iam.InstanceProfile(
      `${args.stackParameters.workspace.id}-instance-profile`,
      {
        name: `${args.stackParameters.workspace.id}-instance-profile`,
        tags: args.tags,
        role: role.name,
      },
      {
        parent: this,
      },
    );

    this.name = instanceProfile.name;
    this.arn = instanceProfile.arn;
  }
}
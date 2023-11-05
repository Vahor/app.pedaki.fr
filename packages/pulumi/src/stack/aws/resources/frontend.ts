import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { env } from '~/env.ts';
import type { StackParameters } from '~/type.ts';
import {CADDY_DOCKER_IMAGE, DOCKER_IMAGE} from '~/utils/docker.ts';


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
  stackParameters: StackParameters<'aws'>;
}

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
        instanceType: this.instanceType(args.stackParameters.server.size),
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

    const dockerComposeContent = pulumi.interpolate`
version: '3.8'
name: pedaki
services:
  web:
    image: "${DOCKER_IMAGE}"
  environment:
    - NEXT_PUBLIC_TESTVALUE="${args.dbHost}"
    - SECRET_PRIVATE_VARIABLE="${args.dbName}"

  caddy:
    image: "${CADDY_DOCKER_IMAGE}"
    restart: unless-stopped
    ports:
      - 80:80
      - 443:443
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
    depends_on:
      - web
`;

    const domain = args.stackParameters.identifier + '.pedaki.fr';

    const caddyFileContent = pulumi.interpolate`

${domain}, :80, :443 {
    reverse_proxy http://web:8000
    
    tls {
        dns cloudflare ${env.CLOUDFLARE_API_TOKEN}
        resolvers 1.1.1.1
    }
}
`;



    return pulumi.interpolate`#!/bin/bash
sudo yum update -y
sudo yum install docker -y

sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

sudo service docker start
sudo systemctl enable docker

sudo docker login -u ${env.APP_DOCKER_USERNAME} -p ${env.APP_DOCKER_PASSWORD} ${env.APP_DOCKER_HOST}

sudo mkdir /app
sudo chown ec2-user:ec2-user /app
cd /app

echo "${caddyFileContent}" > Caddyfile
echo "${dockerComposeContent}" > docker-compose.yml

sudo docker-compose pull
sudo docker-compose up -d
        `;
  };

  private instanceType = (size: StackParameters<'aws'>['server']['size']) => {
    switch (size) {
      case 'small':
        return 't3a.micro';
    }
  };
}
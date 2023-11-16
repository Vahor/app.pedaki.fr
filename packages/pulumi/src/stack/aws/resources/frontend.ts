import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { env } from '~/env.ts';
import type { StackParameters } from '~/type.ts';
import { CADDY_DOCKER_IMAGE, DOCKER_IMAGE } from '~/utils/docker.ts';

export interface WebServiceArgs {
  dbHost: pulumi.Output<string>;
  dbName: pulumi.Output<string>;
  dbUser: pulumi.Output<string>;
  dbPassword: pulumi.Output<string | undefined>;
  dbPort: pulumi.Output<number>;
  dbEncryptionKey: string;
  passwordSalt: string;
  authSecret: string;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string>[];
  securityGroupIds: pulumi.Output<string>[];
  tags: Record<string, string>;
  stackParameters: StackParameters<'aws'>;
}

export class WebService extends pulumi.ComponentResource {
  public readonly publicIp: pulumi.Output<string>;
  public readonly arn: pulumi.Output<string>;

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

    this.publicIp = ec2.publicIp;
    this.arn = ec2.arn;

    this.registerOutputs({});
  }

  private startScript = (args: WebServiceArgs) => {
    let rawEnvFileContent = '';
    for (const [key, value] of Object.entries(args.stackParameters.server.environment_variables)) {
      rawEnvFileContent += `export ${key}='${value}'\n`;
    }

    const envFileContent = pulumi.interpolate`
${rawEnvFileContent}

export DATABASE_URL='mysql://${args.dbUser}:${args.dbPassword}@${args.dbHost}:${args.dbPort}/${args.dbName}?sslaccept=strict'
export PRISMA_ENCRYPTION_KEY='${args.dbEncryptionKey}'

export PASSWORD_SALT='${args.passwordSalt}'
export NEXTAUTH_SECRET='${args.authSecret}'

export RESEND_API_KEY='${env.RESEND_API_KEY}'

export PEDAKI_AUTH_TOKEN='${args.stackParameters.server.environment_variables.PEDAKI_AUTH_TOKEN}'
`;

    const dockerComposeContent = pulumi.interpolate`
version: '3.8'
name: pedaki
services:
    web:
        image: '${DOCKER_IMAGE}'
        env_file:
            - web-variables.env
        restart: unless-stopped

    caddy:
        image: '${CADDY_DOCKER_IMAGE}'
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
{
    email developers@pedaki.fr
    acme_dns cloudflare ${env.CLOUDFLARE_API_TOKEN}
}
https://${domain}, :80, :443 {
    reverse_proxy http://web:8000
    encode zstd gzip
    
    # HSTS (63072000 seconds)
    header / Strict-Transport-Security "max-age=63072000"
    
    # hidden server name
    header -Server
    
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
sudo systemctl start docker

sudo docker login -u ${env.APP_DOCKER_USERNAME} -p ${env.APP_DOCKER_PASSWORD} ${env.APP_DOCKER_HOST}

sudo mkdir /app
sudo chown ec2-user:ec2-user /app
cd /app

echo "${caddyFileContent}" > Caddyfile
echo "${dockerComposeContent}" > docker-compose.yml
echo "${envFileContent}" > web-variables.env

# Increase the maximum number of file descriptors
# https://github.com/quic-go/quic-go/wiki/UDP-Buffer-Sizes
sysctl -w net.core.rmem_max=2500000

sudo /usr/local/bin/docker-compose pull
sudo /usr/local/bin/docker-compose up -d

sleep 30
# If the service is not started, exit with an error
if ! sudo /usr/local/bin/docker-compose ps | grep -q "Up"; then
   sudo shutdown -r now
fi
`;
  };

  private instanceType = (size: StackParameters<'aws'>['server']['size']) => {
    switch (size) {
      case 'small':
        return 't2.micro'; // free tier
    }
  };
}

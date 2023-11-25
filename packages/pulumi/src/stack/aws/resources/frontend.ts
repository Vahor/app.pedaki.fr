import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { env } from '~/env.ts';
import type { Secrets } from '~/stack/aws/resources/secrets.ts';
import type { StackParameters } from '~/type.ts';
import { CADDY_DOCKER_IMAGE, CLI_DOCKER_IMAGE, DOCKER_IMAGE } from '~/utils/docker.ts';

export interface WebServiceArgs {
  instanceProfileArn: pulumi.Output<string>;
  secrets: Secrets;
  vpc: {
    subnetIds: pulumi.Output<string>[];
    securityGroupIds: pulumi.Output<string>[];
  };
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
          { name: 'name', values: ['al2023-ami-minimal*-x86_64'] },
          { name: 'owner-id', values: ['137112412989'] },
        ],
      })
      .then(ami => ami.id);

    const ec2Name = `${name}-ec2`;
    const ec2 = new aws.ec2.Instance(
      ec2Name,
      {
        instanceType: this.instanceType(args.stackParameters.server.size),
        vpcSecurityGroupIds: args.vpc.securityGroupIds,
        subnetId: args.vpc.subnetIds[0],
        ami: amiId,
        iamInstanceProfile: args.instanceProfileArn,
        userData: this.startScript(args),
        userDataReplaceOnChange: true, // Force to recreate the ec2 instance when the script changes
        ipv6AddressCount: 0, // Disable ipv6
        rootBlockDevice: {
          volumeSize: 16,
          volumeType: 'gp3',
          deleteOnTermination: true,
        },
        metadataOptions: {
          httpTokens: 'required',
        },
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
    const dockerComposeContent = pulumi.interpolate`
version: '3.8'
name: pedaki
services:
    web:
        image: '${DOCKER_IMAGE}'
        env_file:
            - .env
        restart: unless-stopped  
        volumes:
            - /app/certificates:/app/certificates
        
    cli:
        image: '${CLI_DOCKER_IMAGE}'
        env_file:
            - .env
        volumes:
            - /app/certificates:/app/certificates

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

    const domain = args.stackParameters.workspace.subdomain + '.pedaki.fr';

    const caddyFileContent = pulumi.interpolate`
{
    email developers@pedaki.fr
}
https://${domain}, :80, :443 {
    reverse_proxy http://web:8000
    encode zstd gzip
    
    # HSTS (63072000 seconds)
    header / Strict-Transport-Security "max-age=63072000"
    
    # hidden server name
    header -Server
    
    tls /app/certs/cloudflare-ca.pem /app/certs/cloudflare-ca-key.pem {
        client_auth {
             mode require_and_verify
             trusted_ca_cert_file /app/certs/cloudflare-origin-pull-ca.pem
        }
        
        resolvers 1.1.1.1
    }
}
`;

    return pulumi.interpolate`#!/bin/bash
set -e -x
export DEBIAN_FRONTEND=noninteractive

sudo yum update -y
sudo yum install docker wget -y

sudo mkdir /app
sudo chown ec2-user:ec2-user /app
cd /app

sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Loading env from ssm parameter store
sudo aws ssm get-parameters --names /shared/resend /shared/docker /shared/cloudflare-ca ${args.secrets.dbParameter} ${args.secrets.authParameter} ${args.secrets.pedakiParameter} ${args.secrets.envParameter} --with-decryption | jq -r '.Parameters | .[] | .Value ' | jq -r 'keys[] as $k | "\\($k)=\\"\\(.[$k])\\""' > .env
source .env


# Download aws RDS CA certificate
mkdir -p /app/certs
sudo wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem -O /app/certs/rds-combined-ca-bundle.pem

# Create files from the cloudflare ca env variables (base64)
echo "$CLOUDFLARE_CA" | base64 -d > /app/certs/cloudflare-ca.pem
echo "$CLOUDFLARE_CA_KEY" | base64 -d > /app/certs/cloudflare-ca-key.pem
echo "$CLOUDFLARE_ORIGIN_CA" | base64 -d > /app/certs/cloudflare-origin-pull-ca.pem

sudo service docker start

sudo docker login -u $APP_DOCKER_USERNAME -p $APP_DOCKER_PASSWORD ${env.APP_DOCKER_HOST}


echo "${caddyFileContent}" > Caddyfile
echo "${dockerComposeContent}" > docker-compose.yml

# Increase the maximum number of file descriptors
# https://github.com/quic-go/quic-go/wiki/UDP-Buffer-Sizes
sudo sysctl -w net.core.rmem_max=2500000

sudo /usr/local/bin/docker-compose pull
sudo /usr/local/bin/docker-compose run --rm cli

# Exit if the cli container failed
if [ $? -ne 0 ]
then
    # TODO: catch error
    echo "Failed to run cli container"
fi

sudo /usr/local/bin/docker-compose up -d caddy web
`;
  };

  private instanceType = (size: StackParameters<'aws'>['server']['size']) => {
    switch (size) {
      case 'small':
        return 't2.micro'; // free tier
    }
  };
}

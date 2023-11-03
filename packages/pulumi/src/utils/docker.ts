import { env } from '~/env.ts';

export const DOCKER_IMAGE = `${env.DOCKER_HOST}/${env.DOCKER_ORGANISATION}/${env.DOCKER_PACKAGE_NAME}:${env.DOCKER_IMAGE_VERSION}`;

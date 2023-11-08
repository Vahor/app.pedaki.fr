# Demo community

Delete the old demo community and all its data.
And create a new one.

We are using the `pedakihq/pedaki-premium` image on `latest` tag.

## Cron

Cron: `0 0 * * 0`

- Run `demo-community` every Sunday at midnight.

## Variables

```env
   AWS_ACCESS_KEY_ID,
   AWS_SECRET_ACCESS_KEY,
   APP_DOCKER_HOST="ghcr.io"
   APP_DOCKER_ORGANISATION="pedakihq"
   APP_DOCKER_PACKAGE_NAME="pedaki-premium"
   APP_DOCKER_IMAGE_VERSION="latest"
   APP_DOCKER_USERNAME,
   APP_DOCKER_PASSWORD,
   PULUMI_ACCESS_TOKEN
```
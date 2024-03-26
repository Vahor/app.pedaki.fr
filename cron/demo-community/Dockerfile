FROM node:18-slim AS base

RUN apt-get update -y && apt-get install -y openssl curl ca-certificates && apt-get clean

FROM base AS builder
WORKDIR /app

# Install corepack pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

COPY turbo.json ./
COPY .npmrc ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/db/package.json ./packages/db/
COPY packages/services/package.json ./packages/services/
COPY packages/pulumi/package.json ./packages/pulumi/
COPY packages/models/package.json ./packages/models/
COPY packages/logger/package.json ./packages/logger/
COPY cron/demo-community/package.json ./cron/demo-community/

RUN --mount=type=cache,id=s/abdf597f-fa85-4c66-a7e0-b512707bd711-/pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY cron/demo-community ./cron/demo-community
COPY packages ./packages
COPY scripts ./scripts

ENV NODE_ENV=production
RUN pnpm build --filter cron-demo-community

WORKDIR /app/packages/db
RUN pnpm prisma generate
WORKDIR /app

# Copy node_modules/.prisma to a tmp folder
RUN mkdir -p tmp
RUN cp -r node_modules/.prisma tmp/.prisma

# Delete node_modules and reinstall only production dependencies
RUN npx rimraf --glob ./**/node_modules
RUN --mount=type=cache,id=s/abdf597f-fa85-4c66-a7e0-b512707bd711-/pnpm,target=/pnpm/store pnpm install --frozen-lockfile --production --filter cron-demo-community

# Copy back node_modules/.prisma
RUN cp -r tmp/.prisma node_modules

FROM base AS runner
WORKDIR /app

# Install pulumi
RUN curl -fsSL https://get.pulumi.com | sh
ENV PATH="/root/.pulumi/bin:$PATH"

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/dist ./node_modules/@pedaki/db
COPY --from=builder /app/packages/models/dist ./node_modules/@pedaki/models
COPY --from=builder /app/packages/services/dist ./node_modules/@pedaki/services
COPY --from=builder /app/packages/pulumi/dist ./node_modules/@pedaki/pulumi
COPY --from=builder /app/packages/logger/dist ./node_modules/@pedaki/logger
COPY --from=builder /app/packages/logger/package.json ./node_modules/@pedaki/package.json
COPY --from=builder /app/cron/demo-community/dist ./dist

ARG DATABASE_URL
ARG PRISMA_ENCRYPTION_KEY

ARG PULUMI_ACCESS_TOKEN

ARG CLOUDFLARE_API_TOKEN
ARG CLOUDFLARE_ZONE_ID

ARG AWS_SECRET_ACCESS_KEY
ARG AWS_ACCESS_KEY_ID

ARG APP_DOCKER_HOST
ARG APP_DOCKER_ORGANISATION
ARG APP_DOCKER_PACKAGE_NAME

# Logger
ARG BASELIME_API_KEY
ARG LOGGER_SERVICE_NAME=cron-demo
ARG LOGGER_LEVEL

###

ENV NODE_ENV=production

ENV DATABASE_URL=$DATABASE_URL
ENV PRISMA_ENCRYPTION_KEY=$PRISMA_ENCRYPTION_KEY

ENV PULUMI_ACCESS_TOKEN=$PULUMI_ACCESS_TOKEN

ENV CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN
ENV CLOUDFLARE_ZONE_ID=$CLOUDFLARE_ZONE_ID

ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID

ENV APP_DOCKER_HOST=$APP_DOCKER_HOST
ENV APP_DOCKER_ORGANISATION=$APP_DOCKER_ORGANISATION
ENV APP_DOCKER_PACKAGE_NAME=$APP_DOCKER_PACKAGE_NAME

# Logger
ENV BASELIME_API_KEY=$BASELIME_API_KEY
ENV LOGGER_SERVICE_NAME=$LOGGER_SERVICE_NAME
ENV LOGGER_LEVEL=$LOGGER_LEVEL

RUN pulumi org set-default pedaki

CMD ["node", "--no-warnings=ExperimentalWarning", "dist/index.js"]

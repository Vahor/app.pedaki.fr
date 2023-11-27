FROM node:18.17-slim AS base

RUN apt-get update -y && apt-get install -y openssl curl ca-certificates && apt-get clean

FROM base  AS builder
WORKDIR /app

# Install corepack pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

COPY turbo.json ./
COPY .npmrc ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/models/package.json ./packages/models/
COPY packages/services/package.json ./packages/services/
COPY packages/logger/package.json ./packages/logger/
COPY packages/pulumi/package.json ./packages/pulumi/

RUN --mount=type=cache,id=s/cab6c3b8-fdd3-400e-be64-4ed3d5840452-/pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages ./packages
COPY scripts ./scripts

# TODO: We can do it with sed
RUN grep -v '@trpc/server/\*": \["../../node_modules/@trpc/server/\*"\]' apps/api/tsconfig.json  > apps/api/tsconfig.json.tmp && mv apps/api/tsconfig.json.tmp apps/api/tsconfig.json

ENV NODE_ENV=production
RUN pnpm build --filter api

# Copy node_modules/.prisma to a tmp folder
RUN mkdir -p tmp
RUN cp -r node_modules/.prisma tmp/.prisma

# Delete node_modules and reinstall only production dependencies
RUN npx rimraf --glob ./**/node_modules
RUN --mount=type=cache,id=s/cab6c3b8-fdd3-400e-be64-4ed3d5840452-/pnpm,target=/pnpm/store pnpm install --frozen-lockfile --production --filter api

# Copy back node_modules/.prisma
RUN cp -r tmp/.prisma node_modules


FROM base  AS runner
WORKDIR /app

# Install pulumi
RUN curl -fsSL https://get.pulumi.com | sh
ENV PATH="/root/.pulumi/bin:$PATH"

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/models/dist ./node_modules/@pedaki/models
COPY --from=builder /app/packages/services/dist ./node_modules/@pedaki/services
COPY --from=builder /app/packages/pulumi/dist ./node_modules/@pedaki/pulumi
COPY --from=builder /app/packages/logger/dist ./node_modules/@pedaki/logger
COPY --from=builder /app/packages/logger/package.json ./node_modules/@pedaki/package.json
COPY --from=builder /app/packages/db/dist ./node_modules/@pedaki/db

## Load public env vars
ARG PORT=8080

ARG RESEND_API_KEY
ARG PULUMI_ACCESS_TOKEN
ARG DATABASE_URL
ARG PRISMA_ENCRYPTION_KEY
ARG STRIPE_SECRET_KEY
ARG API_INTERNAL_SECRET
ARG API_ENCRYPTION_KEY

# Logger
ARG BASELIME_API_KEY
ARG LOGGER_SERVICE_NAME=api
ARG LOGGER_LEVEL

###

ENV PORT=$PORT
ENV PULUMI_ACCESS_TOKEN=$PULUMI_ACCESS_TOKEN
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV PRISMA_ENCRYPTION_KEY=$PRISMA_ENCRYPTION_KEY
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV API_INTERNAL_SECRET=$API_INTERNAL_SECRET
ENV API_ENCRYPTION_KEY=$API_ENCRYPTION_KEY

ENV NODE_ENV=production
ENV SKIP_SERVER_ENV_CHECK=true

# Logger
ENV BASELIME_API_KEY=$BASELIME_API_KEY
ENV LOGGER_SERVICE_NAME=$LOGGER_SERVICE_NAME
ENV LOGGER_LEVEL=$LOGGER_LEVEL

EXPOSE $PORT

RUN pulumi org set-default pedaki
RUN pulumi plugin install resource aws
RUN pulumi plugin install resource random
RUN pulumi plugin install resource cloudflare

CMD ["node", "dist/index.js"]
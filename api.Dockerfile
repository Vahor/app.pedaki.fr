FROM node:18-slim AS base

RUN apt-get update -y && apt-get install -y openssl curl ca-certificates


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
COPY packages/auth/package.json ./packages/auth/
COPY packages/settings/package.json ./packages/settings/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages ./packages

ENV NODE_ENV=production
RUN pnpm build --filter api

# Copy node_modules/.prisma to a tmp folder
RUN mkdir -p tmp
RUN cp -r node_modules/.prisma tmp/.prisma

# Delete node_modules and reinstall only production dependencies
RUN npx rimraf --glob **/node_modules
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --production --filter api

# Copy back node_modules/.prisma
RUN cp -r tmp/.prisma node_modules/.prisma


FROM base  AS runner
WORKDIR /app

RUN curl -fsSL https://get.pulumi.com | sh
ENV PATH="/root/.pulumi/bin:$PATH"

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/auth/dist ./node_modules/@pedaki/auth
COPY --from=builder /app/packages/settings/dist ./node_modules/@pedaki/settings
COPY --from=builder /app/packages/db/dist ./node_modules/@pedaki/db

## Load public env vars
ARG PULUMI_ACCESS_TOKEN
ARG PORT=8080
ARG RESEND_API_KEY
ARG PASSWORD_SALT
ARG DATABASE_URL
ARG NEXTAUTH_SECRET

ENV PORT=$PORT
ENV PULUMI_ACCESS_TOKEN=$PULUMI_ACCESS_TOKEN
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV PASSWORD_SALT=$PASSWORD_SALT
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

ENV NODE_ENV=production
ENV SKIP_SERVER_ENV_CHECK=true

EXPOSE $PORT

CMD ["node", "dist/index.js"]
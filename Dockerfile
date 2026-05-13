# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install -g npm@11.12.1 && npm ci --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* values are baked into the client bundle at build time.
# Override them with --build-arg in real environments.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ARG NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# pg_dump for /api/cron/backup-db (Postgres 16 client)
RUN apk add --no-cache postgresql16-client

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

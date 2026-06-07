# ============================================
# EduFund Portal — Dockerfile for Railway
# ============================================

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm install

# Stage 2: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove conflicting files
RUN rm -f "app/applications/[id]/route.ts"
RUN rm -f "app/api/applications/[id]/page.tsx"

# Generate Prisma client
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"

RUN npm run build

# Stage 3: Runner — full node_modules for reliability
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Full node_modules (ensures all packages available at runtime)
COPY --from=builder /app/node_modules ./node_modules

# Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Startup script
COPY --from=builder /app/scripts ./scripts
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads
RUN chmod +x ./scripts/start.sh

USER nextjs

EXPOSE 3000

CMD ["sh", "./scripts/start.sh"]

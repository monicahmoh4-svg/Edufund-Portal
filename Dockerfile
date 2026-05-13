# ============================================
# EduFund Portal — Dockerfile for Railway
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files AND prisma schema before npm install
# (postinstall runs "prisma generate" which needs schema.prisma)
COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove any conflicting route/page files before build
RUN rm -f "app/applications/[id]/route.ts"
RUN rm -f "app/api/applications/[id]/page.tsx"

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (standalone output required for Docker)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"

RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# tsx for seed script
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/.bin/tsx ./node_modules/.bin/tsx

# Startup script
COPY --from=builder /app/scripts ./scripts
RUN mkdir -p ./public/uploads && chown nextjs:nodejs ./public/uploads
RUN chmod +x ./scripts/start.sh

USER nextjs

EXPOSE 10000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "./scripts/start.sh"]

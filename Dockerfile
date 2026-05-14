# ============================================
# EduFund Portal — Dockerfile for Railway
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove conflicting route/page files before build
RUN rm -f "app/applications/[id]/route.ts"
RUN rm -f "app/api/applications/[id]/page.tsx"

# Generate Prisma client
RUN npx prisma generate

# Build Next.js standalone
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
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma runtime files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Auth & crypto packages (must be in node_modules for standalone)
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/jsonwebtoken ./node_modules/jsonwebtoken
COPY --from=builder /app/node_modules/jws ./node_modules/jws
COPY --from=builder /app/node_modules/jwa ./node_modules/jwa
COPY --from=builder /app/node_modules/ecdsa-sig-formatter ./node_modules/ecdsa-sig-formatter
COPY --from=builder /app/node_modules/ms ./node_modules/ms
COPY --from=builder /app/node_modules/lodash.once ./node_modules/lodash.once
COPY --from=builder /app/node_modules/lodash.isstring ./node_modules/lodash.isstring
COPY --from=builder /app/node_modules/lodash.isboolean ./node_modules/lodash.isboolean
COPY --from=builder /app/node_modules/lodash.isnumber ./node_modules/lodash.isnumber
COPY --from=builder /app/node_modules/lodash.isinteger ./node_modules/lodash.isinteger
COPY --from=builder /app/node_modules/lodash.isplainobject ./node_modules/lodash.isplainobject
COPY --from=builder /app/node_modules/lodash.includes ./node_modules/lodash.includes

# Email
COPY --from=builder /app/node_modules/nodemailer ./node_modules/nodemailer

# File uploads
COPY --from=builder /app/node_modules/multer ./node_modules/multer
COPY --from=builder /app/node_modules/busboy ./node_modules/busboy
COPY --from=builder /app/node_modules/streamsearch ./node_modules/streamsearch

# Seed script
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/.bin/tsx ./node_modules/.bin/tsx

# Startup script
COPY --from=builder /app/scripts ./scripts
RUN mkdir -p ./public/uploads && chown nextjs:nodejs ./public/uploads
RUN chmod +x ./scripts/start.sh

USER nextjs

EXPOSE 3000

CMD ["sh", "./scripts/start.sh"]

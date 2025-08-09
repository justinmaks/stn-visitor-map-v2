# Multi-stage build using Node 24 (Alpine)
FROM node:24-alpine AS base
WORKDIR /app

# Install build dependencies only where needed
FROM base AS deps
# better-sqlite3 needs toolchain and sqlite headers at build-time
RUN apk add --no-cache python3 make g++ pkgconfig sqlite-dev
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
# include dev deps for building
RUN npm ci --include=dev

FROM base AS builder
# ensure production semantics for Next build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Final runtime image
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# where the SQLite DB will live; bind-mounted via compose
ENV DB_PATH=/app/data/visitors.db
# runtime libs only (no compilers)
RUN apk add --no-cache sqlite-libs libstdc++

# Create unprivileged user (Alpine tools)
RUN addgroup -S nodejs && adduser -S -G nodejs nodejs

# App artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
# Reuse compiled native modules from deps, then prune dev deps
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
RUN npm prune --omit=dev

# Ensure data dir exists and owned by app user
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app && chmod -R 775 /app/data
USER nodejs

EXPOSE 3000
CMD ["npm", "start"]

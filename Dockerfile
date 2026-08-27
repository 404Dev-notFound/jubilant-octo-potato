# ==============================================================================
# CodeCollab Production Multi-Stage Dockerfile
# ==============================================================================

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies including devDependencies for Prisma generate
COPY package*.json ./
RUN npm ci

# Copy application source & generate Prisma client
COPY . .
RUN if [ -f "./prisma/schema.prisma" ]; then npx prisma generate; fi

# Prune devDependencies for production
RUN npm prune --production

# ------------------------------------------------------------------------------
# Production Runner Stage
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 codecollab

# Copy production artifacts
COPY --from=builder --chown=codecollab:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=codecollab:nodejs /app/prisma ./prisma
COPY --from=builder --chown=codecollab:nodejs /app/codecollab\ data ./codecollab\ data
COPY --from=builder --chown=codecollab:nodejs /app ./

USER codecollab

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]

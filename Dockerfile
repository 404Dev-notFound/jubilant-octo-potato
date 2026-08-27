# ==============================================================================
# CodeCollab Production Multi-Stage Dockerfile
# ==============================================================================

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests and files required by lifecycle scripts (postinstall)
COPY package*.json ./
COPY load-env.js ./
COPY scripts ./scripts
COPY prisma ./prisma

# Install dependencies including devDependencies (triggers postinstall prisma generate)
RUN npm ci

# Copy full application source code
COPY . .

# Ensure Prisma client is generated for container architecture
RUN node scripts/run-prisma.js generate

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

# Copy production artifacts from builder stage
COPY --from=builder --chown=codecollab:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=codecollab:nodejs /app/package*.json ./
COPY --from=builder --chown=codecollab:nodejs /app/prisma ./prisma
COPY --from=builder --chown=codecollab:nodejs /app/scripts ./scripts
COPY --from=builder --chown=codecollab:nodejs /app/load-env.js ./load-env.js
COPY --from=builder --chown=codecollab:nodejs /app/server.js ./server.js
COPY --from=builder --chown=codecollab:nodejs /app/codecollab\ data ./codecollab\ data
COPY --from=builder --chown=codecollab:nodejs /app/css ./css
COPY --from=builder --chown=codecollab:nodejs /app/js ./js
COPY --from=builder --chown=codecollab:nodejs /app/index.html ./index.html
COPY --from=builder --chown=codecollab:nodejs /app/pre_deploy.md ./pre_deploy.md

USER codecollab

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]

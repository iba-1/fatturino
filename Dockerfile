# ── Stage 1: Builder ──────────────────────────────────────
FROM node:20-slim AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./

# Copy all package.json files for dependency resolution
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY apps/web/package.json apps/web/tsconfig.json apps/web/tsconfig.node.json ./apps/web/
COPY apps/web/postcss.config.js apps/web/tailwind.config.js apps/web/vite.config.ts ./apps/web/
COPY apps/web/index.html ./apps/web/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/fattura-xml/package.json packages/fattura-xml/tsconfig.json ./packages/fattura-xml/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/ ./apps/

# Build everything (turbo handles dependency order)
RUN pnpm build

# Prune dev dependencies
RUN pnpm prune --prod

# ── Stage 2: Runtime ──────────────────────────────────────
FROM node:20-slim AS runtime

# Install Playwright Chromium system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxkbcommon0 \
    libatspi2.0-0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    libwayland-client0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built artifacts and production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy built packages
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/fattura-xml/dist ./packages/fattura-xml/dist
COPY --from=builder /app/packages/fattura-xml/package.json ./packages/fattura-xml/

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/src/db/migrations ./apps/api/src/db/migrations

# Copy built frontend
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Install Playwright Chromium browser
RUN npx playwright install chromium

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "node apps/api/dist/db/migrate.js && node apps/api/dist/server.js"]

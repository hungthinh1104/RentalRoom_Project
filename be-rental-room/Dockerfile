# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies with caching
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --legacy-peer-deps

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build application
RUN npm run build

# Prune devDependencies
RUN npm prune --production --legacy-peer-deps

# Clean up node_modules aggressively
RUN find node_modules -name "*.md" -delete && \
    find node_modules -name "*.ts" -not -path "*/node_modules/.prisma/*" -delete && \
    find node_modules -name "*.map" -delete && \
    find node_modules -name "LICENSE*" -delete && \
    find node_modules -name "CHANGELOG*" -delete && \
    find node_modules -name "README*" -delete && \
    find node_modules -name ".github" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "docs" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "examples" -type d -exec rm -rf {} + 2>/dev/null || true

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies + PM2
RUN apk add --no-cache \
    openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && npm install -g pm2 \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=production \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    NODE_OPTIONS="--max-old-space-size=512"

# Copy package files
COPY --from=builder /app/package*.json ./

# Copy production node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy email templates
COPY --from=builder /app/src/templates ./dist/src/templates

# Copy PM2 config
COPY ecosystem.config.json ./

# Create non-root user
RUN addgroup -g 1001 -S app && \
    adduser -S -u 1001 app -G app && \
    chown -R app:app /app

USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3001

# Use PM2 for process management
CMD ["pm2-runtime", "start", "ecosystem.config.json"]

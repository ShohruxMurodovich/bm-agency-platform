# Node.js backend - Optimized for 4GB RAM
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application with memory limit
RUN NODE_OPTIONS="--max-old-space-size=512" npm run build

# Production stage
FROM node:20-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Set Node.js memory limit for production (800MB max)
ENV NODE_OPTIONS="--max-old-space-size=800"
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies and clean cache
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/system/status || exit 1

# Start the application
CMD ["node", "dist/main.js"]

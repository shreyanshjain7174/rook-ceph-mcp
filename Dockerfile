FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const req = http.request({hostname: 'localhost', port: 3000, path: '/health', method: 'GET'}, \
    (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Start the server
CMD ["npm", "start"]
# --- Stage 1: Build ---
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install ALL dependencies (including devDeps for build)
RUN npm ci

# Copy source code
COPY . .

# Build the NestJS application
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built files and manifest from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Create the directory for image uploads (referenced in main.ts)
RUN mkdir -p /app/imageUploads

# Expose the port defined in main.ts
EXPOSE 3000

# Start the server
CMD ["node", "dist/main"]
# Multi-stage Dockerfile for Limbando School Access & Attendance System
# Stage 1: Build client static assets
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and server codebase
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/node_modules/sql.js/dist/sql-wasm.wasm ./node_modules/sql.js/dist/sql-wasm.wasm

# Persistent SQLite database directory
RUN mkdir -p /app/data && chown -R node:node /app

USER node
EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "server.ts"]

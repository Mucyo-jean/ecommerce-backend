# ----------------------------------------------------------------------------
# Multi-stage Dockerfile for the Matic E-Commerce backend
# ----------------------------------------------------------------------------

# ---- Stage 1: build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install all deps (incl. dev) using the lockfile for reproducible builds.
COPY package*.json ./
RUN npm install

# Generate Prisma client, then compile TypeScript.
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only production dependencies in the final image.
COPY package*.json ./
RUN npm install --omit=dev

# Prisma client + schema needed at runtime for migrations.
COPY prisma ./prisma
RUN npx prisma generate

# Compiled JS output.
COPY --from=builder /app/dist ./dist

EXPOSE 4000

# Apply pending migrations, then start. (Seed runs separately, see compose.)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

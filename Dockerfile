
# Install dependencies
FROM node:20-alpine AS deps

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./

RUN pnpm install --frozen-lockfile


# Build the Next.js app
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN pnpm build


# Run the production build
FROM node:20-alpine AS runner

# Install tini to handle process signals correctly
RUN apk add --no-cache tini

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

# ✅ OPTIMIZED: Add Node.js memory limits to prevent memory overflow
ENV NODE_OPTIONS="--max-old-space-size=1024 --max-semi-space-size=128 --optimize-for-size"

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

# Run the app with memory limits
CMD ["sh", "-c", "node $NODE_OPTIONS ./node_modules/.bin/next start"]

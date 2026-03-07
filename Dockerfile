FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm install

# Build frontend
COPY web/ web/
RUN npm run build -w web

# Build backend
COPY server/ server/
RUN npm run build -w server

# Production image
FROM node:20-alpine AS runtime
WORKDIR /app

COPY package.json package-lock.json* ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm install --omit=dev

COPY --from=base /app/server/dist server/dist
COPY --from=base /app/web/dist web/dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server/dist/index.js"]

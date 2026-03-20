# ── Stage 1: Build React frontend ─────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/image-gallery
COPY image-gallery/package*.json ./
RUN npm install
COPY image-gallery/ ./
RUN npm run build

# ── Stage 2: Production server ────────────────────────────────
FROM node:20-alpine AS production

# sharp needs these native libs on Alpine
RUN apk add --no-cache vips-dev python3 make g++

WORKDIR /app

# Root deps
COPY package*.json ./
RUN npm install --omit=dev

# Backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Source files
COPY backend/ ./backend/
COPY server.js ./

# Built frontend from stage 1
COPY --from=frontend-builder /app/image-gallery/dist ./image-gallery/dist

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "server.js"]

FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY esbuild.config.js ./esbuild.config.js
COPY src ./src
RUN npm install --omit=dev
RUN npm run build:src

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000

CMD ["node", "dist/index.js"]

FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json .
RUN npm install

FROM node:22-alpine AS builder

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start"]

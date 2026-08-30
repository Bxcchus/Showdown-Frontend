FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG PINKWARD_BACKEND_ORIGIN
ARG NEXT_PUBLIC_PINKWARD_IDENTITY_ORIGIN
ARG NEXT_PUBLIC_PINKWARD_WEBSOCKET_ORIGIN
ARG SHOWDOWN_WEB_ORIGIN
ENV NODE_ENV=production \
    PINKWARD_BACKEND_ORIGIN=${PINKWARD_BACKEND_ORIGIN} \
    NEXT_PUBLIC_PINKWARD_IDENTITY_ORIGIN=${NEXT_PUBLIC_PINKWARD_IDENTITY_ORIGIN} \
    NEXT_PUBLIC_PINKWARD_WEBSOCKET_ORIGIN=${NEXT_PUBLIC_PINKWARD_WEBSOCKET_ORIGIN} \
    SHOWDOWN_WEB_ORIGIN=${SHOWDOWN_WEB_ORIGIN}
RUN npm run build

FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS runtime

ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=10 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]

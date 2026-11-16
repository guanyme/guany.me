FROM node:26-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN npm install -g "$(node -p "require('./package.json').packageManager")"
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY tsconfig.json tsr.config.json vite.config.ts vite.node.config.ts vite.shared.ts ./
COPY content/ ./content/
COPY messages/ ./messages/
COPY project.inlang/ ./project.inlang/
COPY public/ ./public/
COPY src/ ./src/
ARG VITE_SITE_URL
RUN pnpm build:node

FROM node:26-alpine AS production

WORKDIR /app
ENV NODE_ENV=production NITRO_HOST=0.0.0.0 NITRO_PORT=3000

COPY --from=build /app/.output ./.output
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]

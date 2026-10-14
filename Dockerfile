# ---- build
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN npm ci --ignore-scripts
COPY tsconfig.base.json ./
COPY packages ./packages
RUN VITE_SERVER_URL=/ npm run build

# ---- run (only the server bundle, its two runtime deps and the built client)
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080
RUN npm init -y >/dev/null && npm i --omit=dev socket.io@4 sirv@3 && npm cache clean --force
COPY --from=build /app/packages/server/dist/index.js ./server/index.js
COPY --from=build /app/packages/client/dist ./client
EXPOSE 8080
CMD ["node", "server/index.js"]

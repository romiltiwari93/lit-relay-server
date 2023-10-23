FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY . .
RUN yarn install
RUN yarn build

ENV NODE_ENV production

RUN addgroup --system --gid 1001 money-relay
RUN adduser --system --uid 1001 money-relay

USER money-relay

EXPOSE 3000

ENV PORT 3000

CMD ["node", "dist/index.js"]

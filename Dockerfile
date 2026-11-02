FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY database/ ./database/
COPY public/ ./public/

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]

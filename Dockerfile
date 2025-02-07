FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY config.js .
COPY index.js .
COPY lib.js .
COPY systemMonitor.js .
COPY .env .

CMD ["node", "index.js"]
FROM node:lts-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install

COPY . .

RUN chmod 777 node_modules

RUN yarn build

ARG DB_URL=DB_URL
ARG PORT=PORT
ARG NODE_ENV=NODE_ENV

EXPOSE 8080/tcp

CMD ["node", "dist/server.js"]
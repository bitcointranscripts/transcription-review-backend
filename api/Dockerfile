FROM node:18.17.0-alpine

RUN apk add g++ make py3-pip

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install --immutable --immutable-cache --check-cache

# Install Sequelize CLI globally
RUN yarn global add sequelize-cli

COPY . .

RUN chmod 777 node_modules

RUN yarn build

COPY ./app/utils/wordDiffWorker.js ./dist/app/utils/wordDiffWorker.js

ARG DB_URL=DB_URL
ARG PORT=PORT
ARG NODE_ENV=NODE_ENV
ENV APP_PATH=/usr/src/app/dist/app/utils/

EXPOSE 8080/tcp

CMD ["sh", "-c", "sequelize-cli db:migrate && node ./dist/server.js"]
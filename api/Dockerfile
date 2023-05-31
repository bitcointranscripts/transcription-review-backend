FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --unsafe-perm=true --allow-root --legacy-peer-deps

COPY . .

RUN chmod 777 node_modules

ARG DB_URL=DB_URL
ARG PORT=PORT
ARG NODE_ENV=NODE_ENV

EXPOSE 8080/tcp

CMD ["node", "server.js"]
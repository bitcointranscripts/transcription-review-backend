FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --unsafe-perm=true --allow-root --legacy-peer-deps

COPY . .

RUN chmod 777 node_modules

ENV DB_URL=${DB_URL}
ENV PORT=${PORT}
ENV NODE_ENV=${NODE_ENV}

RUN npx sequelize db:migrate

RUN npx sequelize db:seed:all

EXPOSE 8080/tcp

CMD ["node", "server.js"]
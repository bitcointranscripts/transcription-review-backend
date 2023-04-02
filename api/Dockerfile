FROM node:16

WORKDIR /usr/src/app/transcription

COPY package*.json ./

RUN npm install --unsafe-perm=true --allow-root --legacy-peer-deps

COPY . .

RUN chmod 777 node_modules

EXPOSE 8080/tcp

CMD ["node", "server.js"]

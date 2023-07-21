# Node api for BTC Transcript Review

- This repo houses the api that powers [review.btctranscripts.com](https://review.btctranscripts.com)

## Setup for Development

## Prerequisites

- Docker
- Ensure ports 8080,5433 and 5432 are open and accept connections (to access the backend api)
- Ensure port 3000 is open to accept connections (to access the frontend client)

### Steps to set up

- Clone the repository

#### Setup Database

- The best way to get a database for development is to use docker

- Navigate to the api directory `cd api`
- Run `make start-deps` to start the container
- `optional` Run `make start-pg-shell` to access the postgres shell or
- Download any database console or explorer to access the database data. We recommend [dbeaver](https://dbeaver.io/)
- To stop the running containers and server, run `make stop-deps`
- Run `make reset-deps` to restart all containers.

#### Setup API

- Navigate to api directory `cd api`
- Create a new .env file and copy the contents of .env.example into it or run `cp .env.example .env`
- In api directory run `yarn install` to install all dependencies
- API calls are processed through a middleware. You can generate a jwt secret locally and replace `JWT_SECRET` in your .env file

(e.g. `const secret = require('crypto').randomBytes(64).toString('hex')`)

- Run `make start` to start the api service. This will run migrations, seed the database and start the server.

- You only need run `make start` the first time. Subsequent run only requires `make run` or `yarn dev`

## API docs endpoints to check out

- Access the endpoints documentation here: `http://localhost:8080/api/docs`

# Node api for Bitcoin Transcripts

- This repo houses the api that powers the bitcoin transcripts review: [review.bitcointranscripts.com](https://review.bitcointranscripts.com)

## Setup for Development

## Prerequisites

- Docker
- Ensure ports 8080,5433 and 5432 are open and accept connections (to access the backend api)
- Ensure port 3000 is open to accept connections (to access the frontend client)

### Steps to set up

- Clone the repository

#### Setup Database

- The best way to get a database for development is to use docker

- Run `docker run --name transcription -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres`
- Run `docker start -i transcription` to start the container
- `optional` Run `docker exec -it transcription psql -U postgres` to access the postgres shell or
- Download any database console or explorer to access the database data. I recommend [dbeaver](https://dbeaver.io/)

#### Setup API

- Navigate to api directory
- Create a new .env file and copy the contents of .env.example into it or run `cp .env.example .env`
- In api directory run `npm install` to install all dependencies
- Run `npm run migrate` to run migrations
- Run `npm run seed` to seed the database
- Run `npm run dev` to start the server

## API docs endpoints to check out

- Access the endpoints documentation here: `http://localhost:8080/api/docs`

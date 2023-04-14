# Node api for Bitcoin Transcripts

- This repo houses the api that powers the bitcoin transcripts review: [review.bitcointranscripts.com](https://review.bitcointranscripts.com)

## Prerequisites

- Docker and docker-compose(preferrably latest stable versions)
- Ensure ports 8080,5433 and 5432 are open and accept connections (to access the backend api)
- Ensure port 3000 is open to accept connections (to access the frontend client)

## Steps to set up

### With Docker

- Clone the repository
- Inside the root directory, run `docker-compose up`
- Access the api here: `http://localhost:8080`
- Access the frontend client here: [https://github.com/bitcointranscripts/transcription-review-front-end](https://github.com/bitcointranscripts/transcription-review-front-end)

### Without Docker

- Clone the repository
- Make sure you have postgres setup or setup postgres database using this link: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
- Create a new database called `bitcoin_transcripts` or follow here on how to create a new db [hhttps://www.postgresql.org/docs/15/tutorial-createdb.html](https://www.postgresql.org/docs/15/tutorial-createdb.html)
- Navigate to api directory
- Create a new .env file and copy the contents of .env.example into it
- Update the .env file with your postgres credentials
- In api directory run `npm install` to install all dependencies
- Run `npm run migrate` to run migrations
- Run `npm run seed` to seed the database
- Run `npm run dev` to start the server

## Some endpoints to check out

- Access the endpoints documentation here: `http://localhost:8080/api/docs`

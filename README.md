# Node api for Bitcoin Transcripts

- This repo houses the api that powers the bitcoin transcripts review: [review.bitcointranscripts.com](https://review.bitcointranscripts.com)

## Prerequisites

- Docker and docker-compose(preferrably latest stable versions)
- Ensure ports 8080,5433 and 5432 are open and accept connections (to access the backend api)
- Ensure port 3000 is open to accept connections (to access the frontend client)

## Steps to set up

- Clone the repository
- Inside the root directory, run `docker-compose up`
- Access the api here: `http://localhost:8080`
- Access the frontend client here: [https://github.com/bitcointranscripts/transcription-review-front-end](https://github.com/bitcointranscripts/transcription-review-front-end)

## Some endpoints to check out

- Access the endpoints documentation here: `http://localhost:8080/api/docs`

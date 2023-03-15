## Node api for Bitcoin Transcripts

### Prerequisites

- Docker and docker-compose(preferrably latest stable versions)
- Ensure ports 8080,5433 and 5432 are open and accept connections (to access the backend api)
- Ensure port 3000 is open to accept connections (to access the frontend client)
    
### Steps to set up

- Clone the repository
- Copy content from .env.example in frontend-next to .env
- Inside the root directory ,run `docker-compose up -d`
- Access the api here: `http://localhost:8080`
- Access the frontend client here: `http://localhost:3000`

### Some endpoints to check out 

- Access the endpoints documentation here: `http://localhost:8080/api/docs`


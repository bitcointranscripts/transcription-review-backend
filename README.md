## Node api for Bitcoin Transcripts

### Prerequisites

- Docker and docker-compose(preferrably latest stable versions)
- Ensure ports 8080,5433 and 5432 are open and accept connections
    
### Steps to set up

- Clone the repository
- Inside the root directory ,run `docker-compose up -d`
- Access the api on here: `http://localhost:8080`


### Some endpoints to check out 

#### GET requests

-   `http://localhost:8080/api/transcripts`
-   `http://localhost:8080/api/users`

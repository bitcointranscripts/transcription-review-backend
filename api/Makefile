start:
	yarn start

dev:
	yarn run migrate
	yarn run seed
	yarn dev

run:
	yarn dev

start-deps:
	docker start transcription || docker run --name transcription -e POSTGRES_PASSWORD=postgress -p 5432:5432 postgres
	docker start -i transcription

start-pg-shell:
	docker exec -it transcription psql -U postgres

stop-deps:
	docker stop transcription

reset-deps:
	make stop-deps & make start-deps

migrate: 
	yarn run migrate

undo-migrate:
	yarn run migrate:undo
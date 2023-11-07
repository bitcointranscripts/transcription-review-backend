start:
	yarn start

init:
	yarn run migrate
	yarn run seed
	yarn dev

run:
	yarn dev

start-deps:
	docker start transcription || docker run --name transcription -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres
	docker start redis || docker run --name redis -p 6379:6379 -d redis
	docker start -i transcription

start-pg-shell:
	docker exec -it transcription psql -U postgres

stop-deps:
	docker stop transcription
	docker stop redis

reset-deps:
	make stop-deps & make start-deps

migrate: 
	yarn run migrate

undo-migrate:
	yarn run migrate:undo
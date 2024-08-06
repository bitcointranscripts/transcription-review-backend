start:
	yarn start

init:
	yarn run migrate
	yarn run seed
	yarn dev

run:
	yarn dev

start-deps:
	docker start transcription-db || docker run --name transcription-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
	docker start transcription-redis || docker run --name transcription-redis -p 6379:6379 -d redis

start-pg-shell:
	docker exec -it transcription-db psql -U postgres

stop-deps:
	docker stop transcription-db
	docker stop transcription-redis

reset-deps:
	make stop-deps & make start-deps

migrate: 
	yarn run migrate

undo-migrate:
	yarn run migrate:undo

create-migration:
	npx sequelize-cli migration:generate --name $(name)

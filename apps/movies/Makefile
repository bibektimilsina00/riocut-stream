.PHONY: help install dev dev-webpack build start lint test clean \
        db-generate db-migrate db-migrate-deploy db-studio db-seed db-reset \
        make-admin \
        docker-up docker-down docker-build docker-logs docker-restart \
        check-env

# Default target
help:
	@echo "movies — available targets:"
	@echo ""
	@echo "  App"
	@echo "    install            npm install dependencies"
	@echo "    dev                Next.js dev server (Turbopack, port 8000)"
	@echo "    dev-webpack        Next.js dev server (webpack, port 8000)"
	@echo "    build              Next.js production build"
	@echo "    start              Start production server"
	@echo "    lint               ESLint"
	@echo "    test               Run tests"
	@echo "    check-env          Validate env vars"
	@echo "    clean              Remove .next, node_modules, build artifacts"
	@echo ""
	@echo "  Database (Prisma)"
	@echo "    db-generate        Generate Prisma client"
	@echo "    db-migrate         Run dev migrations"
	@echo "    db-migrate-deploy  Deploy migrations (prod)"
	@echo "    db-studio          Open Prisma Studio"
	@echo "    db-seed            Seed database"
	@echo "    db-reset           Reset database (DESTRUCTIVE)"
	@echo "    make-admin         Promote user to admin"
	@echo ""
	@echo "  Docker"
	@echo "    docker-up          docker compose up -d"
	@echo "    docker-down        docker compose down"
	@echo "    docker-build       Build app image"
	@echo "    docker-logs        Tail container logs"
	@echo "    docker-restart     Restart app container"

# ---------- App ----------
install:
	npm install

dev:
	npm run dev

dev-webpack:
	npm run dev:webpack

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

test:
	npm test

check-env:
	node check-env.mjs

clean:
	rm -rf .next node_modules dist

# ---------- Database ----------
db-generate:
	npm run db:generate

db-migrate:
	npm run db:migrate

db-migrate-deploy:
	npm run db:migrate:deploy

db-studio:
	npm run db:studio

db-seed:
	npm run db:seed

db-reset:
	npm run db:reset

make-admin:
	npm run make-admin

# ---------- Docker ----------
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose build

docker-logs:
	docker compose logs -f

docker-restart:
	docker compose restart app

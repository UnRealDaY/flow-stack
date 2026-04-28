.PHONY: up down restart logs ps build clean env migrate seed test help
.DEFAULT_GOAL := help

# ─── Infrastructure ───────────────────────────────────────────────────────────

up:           ## Start all infrastructure containers
	docker compose up -d

down:         ## Stop all containers
	docker compose down

restart:      ## Restart all containers
	docker compose restart

ps:           ## Show container status
	docker compose ps

build:        ## Rebuild all Docker images
	docker compose build --no-cache

clean:        ## Stop containers and remove volumes (DESTRUCTIVE)
	docker compose down -v --remove-orphans

# ─── Env ─────────────────────────────────────────────────────────────────────

env:          ## Create .env from .env.example (safe — does not overwrite)
	@test -f .env && echo ".env already exists, skipping." || (cp .env.example .env && echo "Created .env")

# ─── Migrations ───────────────────────────────────────────────────────────────

migrate:      ## Run all migrations (Prisma + Laravel)
	@echo "── Prisma migrate ──────────────────────────────"
	cd apps/core-api && npx prisma migrate dev --name auto
	@echo "── Laravel migrate ─────────────────────────────"
	cd apps/payment && php artisan migrate --force

migrate-prod: ## Deploy migrations in production (no prompt)
	cd apps/core-api && npx prisma migrate deploy
	cd apps/payment && php artisan migrate --force

# ─── Logs ─────────────────────────────────────────────────────────────────────

logs:         ## Tail all logs (pass s=<service> to filter, e.g. make logs s=postgres)
	docker compose logs -f $(s)

# ─── Seed ─────────────────────────────────────────────────────────────────────

seed:         ## Populate demo data for all services
	@echo "── Seeding core-api (Prisma) ───────────────────"
	cd apps/core-api && npx ts-node prisma/seed.ts
	@echo "── Seeding payment (Laravel) ───────────────────"
	cd apps/payment && php artisan db:seed

# ─── Tests ───────────────────────────────────────────────────────────────────

test:         ## Run tests across all services
	@echo "── core-api (Jest) ─────────────────────────────"
	cd apps/core-api && npm test
	@echo "── realtime (Jest) ─────────────────────────────"
	cd apps/realtime && npm test
	@echo "── file-service (pytest) ───────────────────────"
	cd apps/file-service && pytest -q
	@echo "── payment (Laravel) ───────────────────────────"
	cd apps/payment && php artisan test

# ─── Dev shortcuts ────────────────────────────────────────────────────────────

core-api:     ## Start core-api dev server
	cd apps/core-api && npm run dev

realtime:     ## Start realtime dev server
	cd apps/realtime && npm run dev

file-service: ## Start file-service API + Celery worker
	cd apps/file-service && uvicorn app.main:app --reload --port 8000 &
	cd apps/file-service && celery -A celery_worker worker --loglevel=info

frontend:     ## Start Next.js frontend
	cd apps/frontend && npm run dev

# ─── Help ─────────────────────────────────────────────────────────────────────

help:         ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

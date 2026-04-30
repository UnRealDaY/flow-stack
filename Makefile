SHELL := bash
.SHELLFLAGS := -c
.PHONY: up down restart logs ps build clean env install setup migrate migrate-prod seed test dev dev-all core-api realtime file-service frontend help
.DEFAULT_GOAL := help

# Load .env and export all variables so every recipe sees them
-include .env
export

# Absolute path — works in both cmd.exe and bash regardless of working directory
ifeq ($(OS),Windows_NT)
    PYTHON     := $(CURDIR)/apps/file-service/.venv/Scripts/python.exe
    VENV_CHECK := $(CURDIR)/apps/file-service/.venv/Scripts/activate
else
    PYTHON     := $(CURDIR)/apps/file-service/.venv/bin/python
    VENV_CHECK := $(CURDIR)/apps/file-service/.venv/bin/activate
endif

# ---- First-time setup --------------------------------------------------------

# Make file rule: only runs if .env does not exist
.env:
	python -c "import shutil; shutil.copy('.env.example', '.env')"
	@echo "Created .env from .env.example"

setup: .env   ## Full first-time setup: env -> docker -> deps -> migrate -> seed
	@echo "[1/5] Starting Docker services..."
	docker compose up -d
	@echo "[2/5] Waiting for Postgres..."
	@docker compose exec -T postgres sh -c "until pg_isready -q; do sleep 1; done"
	@echo "      Postgres is ready."
	@echo "[3/5] Installing dependencies..."
	@$(MAKE) install
	@echo "[4/5] Running migrations..."
	@$(MAKE) migrate
	@echo "[5/5] Seeding demo data..."
	@$(MAKE) seed
	@echo ""
	@echo "Done. Run: make dev"

install:      ## Install all service dependencies
	@echo "--- core-api (npm) ---"
	cd apps/core-api && npm install
	@echo "--- realtime (npm) ---"
	cd apps/realtime && npm install
	@echo "--- frontend (npm) ---"
	cd apps/frontend && npm install
	@echo "--- file-service (pip) ---"
	$(if $(wildcard $(VENV_CHECK)),,python -m venv apps/file-service/.venv)
	$(PYTHON) -m pip install -q -r apps/file-service/requirements.txt
	@echo "--- payment (composer) ---"
	cd apps/payment && composer install --no-interaction --prefer-dist -q
	python -c "import shutil; shutil.copy('apps/payment/.env.example', 'apps/payment/.env')"
	cd apps/payment && php artisan key:generate --ansi

# ---- Infrastructure ----------------------------------------------------------

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

# ---- Env ---------------------------------------------------------------------

env:          ## Create .env from .env.example (safe, does not overwrite)
	@$(MAKE) .env

# ---- Migrations --------------------------------------------------------------

migrate:      ## Run all migrations (Prisma + Alembic + Laravel)
	@echo "--- Prisma ---"
	cd apps/core-api && npm run migrate:prod
	@echo "--- Alembic ---"
	cd apps/file-service && $(PYTHON) -m alembic upgrade head
	@echo "--- Laravel ---"
	cd apps/payment && php artisan migrate --force

migrate-prod: ## Deploy migrations in production (no prompt)
	cd apps/core-api && npm run migrate:prod
	cd apps/file-service && $(PYTHON) -m alembic upgrade head
	cd apps/payment && php artisan migrate --force

# ---- Logs --------------------------------------------------------------------

logs:         ## Tail logs (pass s=<service> to filter, e.g. make logs s=postgres)
	docker compose logs -f $(s)

# ---- Seed --------------------------------------------------------------------

seed:         ## Populate demo data for all services
	@echo "--- Seeding core-api ---"
	cd apps/core-api && npm run seed
	@echo "--- Seeding payment ---"
	cd apps/payment && php artisan db:seed

# ---- Tests -------------------------------------------------------------------

test:         ## Run tests across all services
	@echo "--- core-api (Jest) ---"
	cd apps/core-api && npm test
	@echo "--- realtime (Jest) ---"
	cd apps/realtime && npm test
	@echo "--- file-service (pytest) ---"
	cd apps/file-service && $(PYTHON) -m pytest -q
	@echo "--- payment (phpunit) ---"
	cd apps/payment && php artisan test

# ---- Dev shortcuts -----------------------------------------------------------

dev:          ## Start core-api + frontend (ports 4000 and 3000)
	@trap 'kill 0' INT; \
	  (cd apps/core-api && npm run dev) & \
	  (cd apps/frontend && npm run dev) & \
	  wait

dev-all:      ## Start all services in parallel
	@trap 'kill 0' INT; \
	  (cd apps/core-api  && npm run dev) & \
	  (cd apps/realtime  && npm run dev) & \
	  (cd apps/frontend  && npm run dev) & \
	  (cd apps/file-service && $(PYTHON) -m uvicorn app.main:app --reload --port 8000) & \
	  wait

core-api:     ## Start core-api dev server
	cd apps/core-api && npm run dev

realtime:     ## Start realtime dev server
	cd apps/realtime && npm run dev

file-service: ## Start file-service API + Celery worker
	cd apps/file-service && $(PYTHON) -m uvicorn app.main:app --reload --port 8000 &
	cd apps/file-service && $(PYTHON) -m celery -A celery_worker worker --loglevel=info

frontend:     ## Start Next.js frontend
	cd apps/frontend && npm run dev

# ---- Help --------------------------------------------------------------------

help:         ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-16s %s\n", $$1, $$2}'

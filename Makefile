PNPM ?= pnpm

PM2 ?= pm2

NPX ?= npx

PYTHON3 ?= python3

PIP3 ?= pip3

PYTHON3_VENV ?= ./py-services/.venv

PRISMA_DB_SCHEMA ?= ./packages/database/prisma/schema.prisma


init:
	$(PNPM) install


build-backend:
	$(PNPM) build


start-backend:
	$(PM2) start ecosystem.config.js


stop-backend:
	$(PM2) delete all


start-dimension-reducer:
	$(PYTHON3) -m venv $(PYTHON3_VENV)
	source $(PYTHON3_VENV)/bin/activate
	cd py-services/dimension-reducer && $(PYTHON3) -m pip install -r requirements.txt


build-webapp:
	$(PNPM) --dir apps/web-app build


start-webapp-dev:
	$(PNPM) --dir apps/web-app dev



db-push: init
	$(NPX) prisma db push --schema=$(PRISMA_DB_SCHEMA)


build-all: init db-push build-backend build-webapp 


start-all: start-backend start-webapp-dev

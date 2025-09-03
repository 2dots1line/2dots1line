PNPM ?= pnpm

PM2 ?= pm2

NPX ?= npx

PYTHON3 ?= python3

PIP3 ?= pip3


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
	cd py-services/dimension-reducer && $(PYTHON3) -m pip install -r requirements.txt && $(PYTHON3) app.py


build-webapp:
	$(PNPM) --dir apps/web-app build


start-webapp-dev:
	$(PNPM) --dir apps/web-app dev



db-push: init
	$(NPX) prisma db push --schema=$(PRISMA_DB_SCHEMA)


build-all: init db-push build-backend build-webapp 


start-all: start-backend start-webapp-dev

# Maintenance worker commands
maintenance-integrity-check:
	@echo "🔍 Triggering maintenance worker integrity check..."
	@cd workers/maintenance-worker && $(PNPM) build
	@node scripts/GUIDES/trigger-maintenance.js integrity-check

maintenance-redis-cleanup:
	@echo "🧹 Triggering Redis cleanup..."
	@cd workers/maintenance-worker && $(PNPM) build
	@node scripts/GUIDES/trigger-maintenance.js redis-cleanup

maintenance-db-optimization:
	@echo "⚡ Triggering database optimization..."
	@cd workers/maintenance-worker && $(PNPM) build
	@node scripts/GUIDES/trigger-maintenance.js db-optimization

maintenance-full-cycle:
	@echo "🔄 Triggering full maintenance cycle..."
	@cd workers/maintenance-worker && $(PNPM) build
	@node scripts/GUIDES/trigger-maintenance.js full-maintenance

maintenance-auto-fix:
	@echo "🔧 Triggering maintenance worker auto-fix..."
	@cd workers/maintenance-worker && $(PNPM) build
	@node scripts/GUIDES/trigger-maintenance.js auto-fix

maintenance-worker-dev:
	@echo "🔧 Starting maintenance worker in development mode..."
	@cd workers/maintenance-worker && $(PNPM) dev

maintenance-worker-build:
	@echo "🔨 Building maintenance worker..."
	@cd workers/maintenance-worker && $(PNPM) build

maintenance-worker-pm2-status:
	@echo "📊 Checking maintenance worker PM2 status..."
	@$(PM2) status maintenance-worker

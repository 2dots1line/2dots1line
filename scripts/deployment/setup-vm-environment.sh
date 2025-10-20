#!/bin/bash

# =============================================================================
# 2D1L VM ENVIRONMENT SETUP SCRIPT
# =============================================================================
# Ensures consistent environment configuration for VM deployments
# =============================================================================

set -e

echo "🚀 ===== 2D1L VM ENVIRONMENT SETUP ====="
echo "🎯 Setting up consistent environment configuration for VM deployment"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# =============================================================================
# STEP 1: VALIDATE PREREQUISITES
# =============================================================================

log_step "STEP 1: Validating prerequisites"

if [ ! -f "envexample.md" ]; then
    log_error "envexample.md not found. Run this script from the project root."
    exit 1
fi

if [ ! -f "docker-compose.dev.yml" ]; then
    log_error "docker-compose.dev.yml not found. Run this script from the project root."
    exit 1
fi

log_success "Prerequisites validated"

# =============================================================================
# STEP 2: CREATE .env FROM TEMPLATE
# =============================================================================

log_step "STEP 2: Creating .env from template"

if [ -f ".env" ]; then
    log_warning ".env already exists. Creating backup..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Convert envexample.md to .env
grep -E '^[A-Z_]+=' envexample.md > .env

# Add missing critical variables if not present
if ! grep -q "DIMENSION_REDUCER_HOST_PORT" .env; then
    echo "" >> .env
    echo "# === DIMENSION REDUCER CONFIGURATION ===" >> .env
    echo "DIMENSION_REDUCER_HOST_PORT=5001 # Python Service" >> .env
    echo "DIMENSION_REDUCER_URL=http://localhost:5001" >> .env
    echo "DIMENSION_REDUCER_URL_DOCKER=http://dimension-reducer:5001" >> .env
fi

log_success ".env created from template"

# =============================================================================
# STEP 3: VALIDATE CRITICAL ENVIRONMENT VARIABLES
# =============================================================================

log_step "STEP 3: Validating critical environment variables"

# Source the .env file
set -a
source .env
set +a

# Check critical variables
MISSING_VARS=()

if [ -z "$DIMENSION_REDUCER_HOST_PORT" ]; then
    MISSING_VARS+=("DIMENSION_REDUCER_HOST_PORT")
fi

if [ -z "$DIMENSION_REDUCER_URL" ]; then
    MISSING_VARS+=("DIMENSION_REDUCER_URL")
fi

if [ -z "$DATABASE_URL" ]; then
    MISSING_VARS+=("DATABASE_URL")
fi

if [ -z "$NEO4J_URI" ]; then
    MISSING_VARS+=("NEO4J_URI")
fi

if [ -z "$WEAVIATE_URL" ]; then
    MISSING_VARS+=("WEAVIATE_URL")
fi

if [ -z "$REDIS_URL" ]; then
    MISSING_VARS+=("REDIS_URL")
fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    log_error "Missing critical environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

log_success "All critical environment variables present"

# =============================================================================
# STEP 4: VALIDATE PORT CONSISTENCY
# =============================================================================

log_step "STEP 4: Validating port consistency"

# Check if DIMENSION_REDUCER_URL matches DIMENSION_REDUCER_HOST_PORT
EXPECTED_URL="http://localhost:${DIMENSION_REDUCER_HOST_PORT}"
if [ "$DIMENSION_REDUCER_URL" != "$EXPECTED_URL" ]; then
    log_error "Port mismatch detected:"
    echo "  DIMENSION_REDUCER_HOST_PORT: $DIMENSION_REDUCER_HOST_PORT"
    echo "  DIMENSION_REDUCER_URL: $DIMENSION_REDUCER_URL"
    echo "  Expected URL: $EXPECTED_URL"
    exit 1
fi

log_success "Port consistency validated"

# =============================================================================
# STEP 5: TEST DOCKER COMPOSE CONFIGURATION
# =============================================================================

log_step "STEP 5: Testing Docker Compose configuration"

# Test if docker-compose can parse the configuration
if ! docker-compose -f docker-compose.dev.yml config > /dev/null 2>&1; then
    log_error "Docker Compose configuration is invalid"
    exit 1
fi

log_success "Docker Compose configuration is valid"

# =============================================================================
# STEP 6: CREATE ENVIRONMENT VALIDATION SCRIPT
# =============================================================================

log_step "STEP 6: Creating environment validation script"

cat > scripts/deployment/validate-environment.sh << 'EOF'
#!/bin/bash

# Quick environment validation script
set -a
source .env
set +a

echo "🔍 Validating 2D1L environment configuration..."

# Check critical services
echo "📡 Testing service connectivity..."

# Test dimension reducer
if curl -s http://localhost:${DIMENSION_REDUCER_HOST_PORT:-5001}/health > /dev/null 2>&1; then
    echo "✅ Dimension reducer: OK"
else
    echo "❌ Dimension reducer: FAILED (port ${DIMENSION_REDUCER_HOST_PORT:-5001})"
fi

# Test database services
if docker ps | grep -q postgres-2d1l; then
    echo "✅ PostgreSQL: Running"
else
    echo "❌ PostgreSQL: Not running"
fi

if docker ps | grep -q neo4j-2d1l; then
    echo "✅ Neo4j: Running"
else
    echo "❌ Neo4j: Not running"
fi

if docker ps | grep -q weaviate-2d1l; then
    echo "✅ Weaviate: Running"
else
    echo "❌ Weaviate: Not running"
fi

if docker ps | grep -q redis-2d1l; then
    echo "✅ Redis: Running"
else
    echo "❌ Redis: Not running"
fi

echo "🎯 Environment validation complete"
EOF

chmod +x scripts/deployment/validate-environment.sh

log_success "Environment validation script created"

# =============================================================================
# COMPLETION
# =============================================================================

echo ""
log_success "===== VM ENVIRONMENT SETUP COMPLETE ====="
echo ""
echo "📋 Next steps:"
echo "  1. Review .env file and update any placeholder values"
echo "  2. Start database services: docker-compose -f docker-compose.dev.yml up -d"
echo "  3. Validate environment: ./scripts/deployment/validate-environment.sh"
echo "  4. Start PM2 services: pm2 start scripts/deployment/ecosystem.config.js"
echo ""
echo "🔍 To validate environment anytime:"
echo "  ./scripts/deployment/validate-environment.sh"
echo ""

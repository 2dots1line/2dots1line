#!/bin/bash
# Health check script for 2D1L services
# This script monitors the health of all services and restarts them if needed

# Log file for health check results
LOG_FILE="/home/$USER/2D1L/logs/health-check.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" | tee -a "$LOG_FILE"
}

# Check API Gateway
if ! curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    log_message "API Gateway health check failed, restarting..."
    pm2 restart api-gateway
    sleep 5
    if curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
        log_message "API Gateway restarted successfully"
    else
        log_message "API Gateway restart failed"
    fi
fi

# Check frontend
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_message "Frontend health check failed, restarting..."
    pm2 restart web-app
    sleep 5
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_message "Frontend restarted successfully"
    else
        log_message "Frontend restart failed"
    fi
fi

# Check Docker containers
if ! docker ps | grep -q "postgres-2d1l"; then
    log_message "PostgreSQL container not running, restarting Docker services..."
    cd /home/$USER/2D1L
    docker-compose -f docker-compose.dev.yml up -d postgres
    sleep 10
    if docker ps | grep -q "postgres-2d1l"; then
        log_message "PostgreSQL container restarted successfully"
    else
        log_message "PostgreSQL container restart failed"
    fi
fi

if ! docker ps | grep -q "redis-2d1l"; then
    log_message "Redis container not running, restarting Docker services..."
    cd /home/$USER/2D1L
    docker-compose -f docker-compose.dev.yml up -d redis
    sleep 10
    if docker ps | grep -q "redis-2d1l"; then
        log_message "Redis container restarted successfully"
    else
        log_message "Redis container restart failed"
    fi
fi

if ! docker ps | grep -q "neo4j-2d1l"; then
    log_message "Neo4j container not running, restarting Docker services..."
    cd /home/$USER/2D1L
    docker-compose -f docker-compose.dev.yml up -d neo4j
    sleep 10
    if docker ps | grep -q "neo4j-2d1l"; then
        log_message "Neo4j container restarted successfully"
    else
        log_message "Neo4j container restart failed"
    fi
fi

if ! docker ps | grep -q "weaviate-2d1l"; then
    log_message "Weaviate container not running, restarting Docker services..."
    cd /home/$USER/2D1L
    docker-compose -f docker-compose.dev.yml up -d weaviate
    sleep 10
    if docker ps | grep -q "weaviate-2d1l"; then
        log_message "Weaviate container restarted successfully"
    else
        log_message "Weaviate container restart failed"
    fi
fi

if ! docker ps | grep -q "dimension-reducer"; then
    log_message "Dimension reducer container not running, restarting Docker services..."
    cd /home/$USER/2D1L
    docker-compose -f docker-compose.dev.yml up -d dimension-reducer
    sleep 10
    if docker ps | grep -q "dimension-reducer"; then
        log_message "Dimension reducer container restarted successfully"
    else
        log_message "Dimension reducer container restart failed"
    fi
fi

# Check PM2 processes
PM2_PROCESSES=$(pm2 list | grep -c "online")
if [ "$PM2_PROCESSES" -lt 12 ]; then
    log_message "Some PM2 processes are not running, restarting all..."
    pm2 restart all
    sleep 10
    PM2_PROCESSES_AFTER=$(pm2 list | grep -c "online")
    log_message "PM2 processes after restart: $PM2_PROCESSES_AFTER"
fi

# Log successful health check
log_message "Health check completed successfully"

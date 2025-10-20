# .env
# Root environment configuration for 2dots1line V7 local development

# === APPLICATION PORTS ===
# Port for the API Gateway (client-facing, exposed FROM host machine TO container)
API_GATEWAY_HOST_PORT=3001
# Internal port the API Gateway container application itself listens on
API_GATEWAY_CONTAINER_PORT=3001

# Port for the Cognitive Hub (if run as a separate Docker service and accessed directly)
# COGNITIVE_HUB_HOST_PORT=8000
# COGNITIVE_HUB_CONTAINER_PORT=8000


# === SECURITY ===
JWT_SECRET=YOUR_JWT_SECRET
JWT_EXPIRES_IN=1d

# === FRONTEND CONFIGURATION ===
# For local development: http://localhost:3000
# For production: https://your-domain.com
FRONTEND_URL=http://localhost:3000

# Frontend API Configuration (NEXT_PUBLIC_* variables are baked into the build)
# For local development: http://localhost:3001
# For production: https://your-api-domain.com
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Weaviate URL for frontend (NEXT_PUBLIC_* variables are baked into the build)
# For local development: http://localhost:8080
# For production: https://your-weaviate-domain.com
NEXT_PUBLIC_WEAVIATE_URL=http://localhost:8080

# === SERVICE URLS ===
# Notification Service URL (for internal communication)
# For local development: http://localhost:3002
# For production: https://your-notification-service.com
NOTIFICATION_SERVICE_URL=http://localhost:3002


# === AI PROVIDER KEYS ===
# For US Region (or default) - Ensure this is your actual Gemini API Key
GOOGLE_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE # Using the one from the top part of your example

# For China Region (if testing locally with DeepSeek)
# DEEPSEEK_API_KEY=YOUR_ACTUAL_DEEPSEEK_API_KEY_HERE

# === MEDIA PROVIDER KEYS ===
# Pexels API key for background media search
PEXELS_API_KEY=YOUR_PEXELS_API_KEY_HERE


# === LLM MODEL CONFIGURATION ===
# Environment-first model selection (highest priority)
# These override the JSON configuration in config/gemini_models.json
LLM_CHAT_MODEL=gemini-2.5-flash
LLM_VISION_MODEL=gemini-2.5-flash
LLM_EMBEDDING_MODEL=text-embedding-004
LLM_FALLBACK_MODEL=gemini-2.0-flash-exp

# Alternative models you can use:
# LLM_CHAT_MODEL=gemini-2.0-flash-exp
# LLM_CHAT_MODEL=gemini-1.5-flash
# LLM_VISION_MODEL=gemini-2.0-flash-exp
# LLM_VISION_MODEL=gemini-1.5-flash

# === MEDIA GENERATION MODELS ===
# Image generation (card covers, thumbnails)
LLM_IMAGE_MODEL=gemini-2.5-flash-image     # Fast, affordable ($0.039/image)

# Video generation (background videos)
LLM_VIDEO_MODEL=veo-3.0-fast-generate-001  # or veo-3.0-generate-001 (quality)

# Live voice interaction
LLM_LIVE_MODEL=gemini-live-2.5-flash-preview-native-audio

# Text-to-speech (if needed separately from live)
LLM_AUDIO_TTS_MODEL=gemini-native-audio

# Alternative Gemini image models:
# LLM_IMAGE_MODEL=imagen-4.0-generate-001      # High quality ($0.03/image)

# OpenAI alternatives (when LLM_PROVIDER=openai):
# LLM_IMAGE_MODEL=dall-e-3                     # OpenAI ($0.04/image)
# LLM_LIVE_MODEL=gpt-4o-realtime-preview
# LLM_AUDIO_TTS_MODEL=tts-1
# Note: OpenAI does not have video generation yet


# === DATABASE CONFIGURATIONS ===

# --- PostgreSQL ---
# Credentials and DB name (used by Docker Compose to initialize PG and by local tools)
POSTGRES_USER=YOUR_POSTGRES_USER
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
POSTGRES_DB_NAME=twodots1line

# Port on your Mac that maps to the PostgreSQL container's port 5432
POSTGRES_HOST_PORT=5433

# Connection URL for Prisma CLI (and other tools running on your Mac, outside Docker)
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_HOST_PORT}/${POSTGRES_DB_NAME}"

# --- Neo4j ---
# Credentials (used by Docker Compose to initialize Neo4j)
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123

# Port on your Mac for Neo4j Browser (HTTP)
NEO4J_HTTP_HOST_PORT=7475
# Port on your Mac for Neo4j Bolt protocol (application connections)
NEO4J_BOLT_HOST_PORT=7688

# Connection URI for applications/tools running *on your host machine* (e.g., cypher-shell)
NEO4J_URI_HOST="neo4j://localhost:${NEO4J_BOLT_HOST_PORT}"

# --- Weaviate ---
WEAVIATE_SCHEME=http # Scheme for Weaviate (http or https) - Used by both host and container connections

# Port on your Mac for Weaviate API
WEAVIATE_HOST_PORT=8080

# Connection host & port for applications/tools running *on your host machine*
WEAVIATE_HOST_LOCAL=localhost:${WEAVIATE_HOST_PORT}

# --- Redis ---
# Port on your Mac for Redis
REDIS_HOST_PORT=6379
# REDIS_PASSWORD= # Uncomment and set if your Redis requires a password

# === GENERAL ===
NODE_ENV=development

# === CONVERSATION TIMEOUT CONFIGURATION ===
# Timeout duration in minutes (default: 5 minutes)
CONVERSATION_TIMEOUT_MINUTES=2
# Check interval in seconds (default: 30 seconds)
TIMEOUT_CHECK_INTERVAL_SECONDS=30
# Enable ingestion queue (default: true)
ENABLE_INGESTION_QUEUE=true

# === INTERNAL DOCKER NETWORK CONFIG (Used by docker-compose.yml for inter-container communication) ===
# These define how services *inside Docker* find each other. The hostnames are the service names from docker-compose.yml.

# PostgreSQL connection details for apps inside Docker
POSTGRES_HOST_FOR_APP_IN_DOCKER=postgres
POSTGRES_PORT_FOR_APP_IN_DOCKER=5432 # Standard internal Postgres port

# Neo4j connection details for apps inside Docker
NEO4J_URI_DOCKER=neo4j://neo4j:7687 # 'neo4j' is service name, 7687 is internal Bolt port

# Weaviate connection details for apps inside Docker
WEAVIATE_SCHEME_DOCKER=http # Scheme is often the same
WEAVIATE_HOST_DOCKER=weaviate:8080 # 'weaviate' is service name, 8080 is internal port

# Redis connection details for apps inside Docker
REDIS_HOST_DOCKER=redis # 'redis' is service name
REDIS_PORT_FOR_APP_IN_DOCKER=6379 # Standard internal Redis port

# === DIMENSION REDUCER CONFIGURATION ===
# Port on your Mac for Dimension Reducer (Python UMAP service)
DIMENSION_REDUCER_HOST_PORT=5001 # Python Service
# Connection URL for applications running on host machine
DIMENSION_REDUCER_URL=http://localhost:5001
# Connection URL for applications running inside Docker
DIMENSION_REDUCER_URL_DOCKER=http://dimension-reducer:5001

# Ensure this .env file is in your .gitignore
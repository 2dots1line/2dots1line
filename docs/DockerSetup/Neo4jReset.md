That's great news that PostgreSQL is up and running smoothly! Adding the other databases (Neo4j, Weaviate, and Redis) to your `docker-compose.yml` follows a very similar pattern. You've already got most of it in the `docker-compose.yml` snippet you shared earlier.

The key is to ensure:
1.  You use the official Docker images for each database.
2.  You map persistent volumes so data isn't lost when containers stop/restart.
3.  You expose the necessary ports from the container to your host machine for local access (e.g., by tools like Neo4j Browser or Prisma Studio connecting to Postgres).
4.  You configure necessary environment variables for each database, especially for authentication and basic setup, sourcing these from your root `.env` file.
5.  All services are on the same Docker network (`2d1l_network`) so they can communicate with each other using their service names as hostnames.

Let's refine the `docker-compose.yml` specifically for adding/confirming Neo4j, Weaviate, and Redis, ensuring they use the environment variables we've discussed for your root `.env` file.

**Your Updated `docker-compose.yml` (Focusing on adding/verifying Neo4j, Weaviate, Redis):**

```yaml
# docker-compose.yml
# No version needed at the top for modern Docker Compose

networks:
  2d1l_network:
    external: true # Reminder: Run 'docker network create 2d1l_network' once manually if it doesn't exist.

services:
  postgres: # You confirmed this is working
    image: postgres:15
    container_name: postgres-2d1l
    ports:
      - "${POSTGRES_HOST_PORT:-5433}:5432" # Host:Container
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB_NAME}
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
    networks:
      - 2d1l_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  neo4j:
    image: neo4j:5.18 # Specify a recent, stable version
    container_name: neo4j-2d1l
    ports:
      - "${NEO4J_HTTP_HOST_PORT:-7474}:7474"   # For Neo4j Browser
      - "${NEO4J_BOLT_HOST_PORT:-7687}:7687"    # For application connections
    networks:
      - 2d1l_network
    environment:
      # NEO4J_AUTH format is user/password
      NEO4J_AUTH: "${NEO4J_USER:-neo4j}/${NEO4J_PASSWORD:-password123}" # Ensure NEO4J_USER and NEO4J_PASSWORD are in your .env
      # Optional: Increase memory if needed, especially for graph algorithms later
      # NEO4J_server_memory_heap_initial__size: "512m"
      # NEO4J_server_memory_heap_max__size: "2G"
    volumes:
      - ./neo4j_data/data:/data             # Mounts the data directory
      - ./neo4j_data/logs:/logs             # Mounts the logs directory
      - ./neo4j_data/import:/var/lib/neo4j/import # For CSV imports if needed
      - ./neo4j_data/plugins:/plugins       # For APOC or other plugins
    restart: unless-stopped
    healthcheck: # Basic healthcheck for Neo4j
      test: ["CMD-SHELL", "wget --spider -q http://localhost:7474 || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s # Give Neo4j time to start up

  weaviate:
    image: semitechnologies/weaviate:1.25.3 # Or latest stable
    container_name: weaviate-2d1l
    ports:
      - "${WEAVIATE_HOST_PORT:-8080}:8080" # HTTP
      - "50051:50051"                     # gRPC
    networks:
      - 2d1l_network
    environment:
      QUERY_DEFAULTS_LIMIT: "25"
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: "true" # For local dev; consider auth for staging/prod
      DEFAULT_VECTORIZER_MODULE: "none" # As per our decision
      ENABLE_MODULES: ""                # No inference modules needed if vectorizer is none
      PERSISTENCE_DATA_PATH: "/var/lib/weaviate"
      CLUSTER_HOSTNAME: 'node1' # Important for Weaviate
      # GOOGLE_API_KEY: "${GOOGLE_API_KEY}" # Only needed if Weaviate itself were doing Gemini embeddings
    volumes:
      - ./weaviate_data:/var/lib/weaviate
    restart: on-failure:0 # Or 'unless-stopped'
    healthcheck: # Basic healthcheck for Weaviate
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/v1/.well-known/ready"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s # Give Weaviate time to start

  redis:
    image: redis:7-alpine # Using a specific alpine version for smaller size
    container_name: redis-2d1l
    ports:
      - "${REDIS_HOST_PORT:-6379}:6379"
    networks:
      - 2d1l_network
    # If you set REDIS_PASSWORD in .env, uncomment and use it here:
    # command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - ./redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  api-gateway: # Assuming this is your main backend app for now
    build:
      context: . # Build from the monorepo root
      dockerfile: ./apps/api-gateway/Dockerfile
    container_name: api-gateway-2d1l
    ports:
      - "${API_GATEWAY_HOST_PORT:-3001}:${API_GATEWAY_CONTAINER_PORT:-3001}"
    depends_on:
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_healthy # Changed to service_healthy assuming healthcheck works
      weaviate:
        condition: service_healthy # Changed to service_healthy
      redis:
        condition: service_healthy
    networks:
      - 2d1l_network
    environment:
      - PORT=${API_GATEWAY_CONTAINER_PORT:-3001}
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST_FOR_APP_IN_DOCKER}:${POSTGRES_PORT_FOR_APP_IN_DOCKER}/${POSTGRES_DB_NAME}
      - NEO4J_URI=${NEO4J_URI_DOCKER} # e.g., neo4j://neo4j:7687
      - NEO4J_USERNAME=${NEO4J_USER}
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
      - WEAVIATE_SCHEME=${WEAVIATE_SCHEME:-http} # Default to http if not in .env
      - WEAVIATE_HOST=${WEAVIATE_HOST_DOCKER}     # e.g., weaviate:8080
      - REDIS_HOST=${REDIS_HOST_DOCKER:-redis}
      - REDIS_PORT=${REDIS_CONTAINER_PORT:-6379}
      # - REDIS_PASSWORD=${REDIS_PASSWORD} # Uncomment if used
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-1d}
      - NODE_ENV=${NODE_ENV:-development}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      # - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
    # volumes: # For development hot-reloading if your Dockerfile doesn't handle it
    #   - ./apps/api-gateway/src:/usr/src/app/src
    #   - /usr/src/app/node_modules # Prevent host node_modules overwriting container's
    restart: unless-stopped

  # Add cognitive-hub service similarly if it's a separate Dockerized service
  # cognitive-hub:
  #   build:
  #     context: .
  #     dockerfile: ./services/cognitive-hub/Dockerfile
  #   container_name: cognitive-hub-2d1l
  #   # ... similar environment variables and depends_on as api-gateway for DBs ...
  #   networks:
  #     - 2d1l_network
  #   restart: unless-stopped

# Define persistent named volumes (optional, Docker creates anonymous ones by default for ./paths)
# volumes:
#   postgres_data:
#   neo4j_data_data: # neo4j image uses /data
#   neo4j_data_logs:
#   neo4j_data_import:
#   neo4j_data_plugins:
#   weaviate_data:
#   redis_data:
```

**Explanation of Key Parts for New Databases:**

*   **`neo4j` service:**
    *   `image: neo4j:5.18`: Using a specific recent version.
    *   `ports`:
        *   `"${NEO4J_HTTP_HOST_PORT:-7474}:7474"`: Maps the Neo4j Browser HTTP port (7474 inside container) to a host port (default 7474, configurable via `.env`).
        *   `"${NEO4J_BOLT_HOST_PORT:-7687}:7687"`: Maps the Bolt protocol port (7687 inside container) for application connections.
    *   `environment`:
        *   `NEO4J_AUTH: "${NEO4J_USER:-neo4j}/${NEO4J_PASSWORD:-password123}"`: Sets the username and password. **Ensure `NEO4J_USER` and `NEO4J_PASSWORD` are in your root `.env` file.**
    *   `volumes`:
        *   `./neo4j_data/data:/data`: Persists the graph data.
        *   `./neo4j_data/logs:/logs`: Persists logs.
        *   `./neo4j_data/import:/var/lib/neo4j/import`: For bulk data import if needed.
        *   `./neo4j_data/plugins:/plugins`: For Neo4j plugins like APOC.
    *   `healthcheck`: A simple check to see if the HTTP interface is up. `start_period` gives Neo4j time to initialize.

*   **`weaviate` service:**
    *   `image: semitechnologies/weaviate:1.25.3`: Using the version specified.
    *   `ports`:
        *   `"${WEAVIATE_HOST_PORT:-8080}:8080"`: Maps Weaviate's HTTP API port.
        *   `"50051:50051"`: For gRPC.
    *   `environment`:
        *   `DEFAULT_VECTORIZER_MODULE: "none"`: **Crucial** as per our decision to use external embeddings.
        *   `AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'`: For local development simplicity. Disable for production.
        *   `CLUSTER_HOSTNAME: 'node1'`: Important for Weaviate.
    *   `volumes`: `./weaviate_data:/var/lib/weaviate` for persistence.
    *   `healthcheck`: Checks the `/v1/.well-known/ready` endpoint.

*   **`redis` service:**
    *   `image: redis:7-alpine`: A specific, lightweight version.
    *   `ports`: `"${REDIS_HOST_PORT:-6379}:6379"`
    *   `command`: Commented out, but shows how to set a password if `REDIS_PASSWORD` is defined in your `.env`.
    *   `volumes`: `./redis_data:/data` for persistence (if Redis persistence is enabled in its config).
    *   `healthcheck`: Uses `redis-cli ping`.

*   **`depends_on` in `api-gateway` (and potentially `cognitive-hub`):**
    *   Updated to include `neo4j`, `weaviate`, and `redis` with `condition: service_healthy` (if healthcheck is robust) or `condition: service_started`. This helps ensure databases are at least starting before the application tries to connect.

**Steps for You to Take:**

1.  **Ensure your root `.env` file is comprehensive and includes all the variables referenced with `${...}` in the `docker-compose.yml` above.**
    *   Specifically, ensure `NEO4J_USER`, `NEO4J_PASSWORD`, `WEAVIATE_HOST_PORT`, `REDIS_HOST_PORT`, `API_GATEWAY_CONTAINER_PORT` and all the `*_DOCKER` and `*_LOCAL_CLI` / `*_HOST` variables are defined.
2.  **Create the local data directories if they don't exist:**
    ```bash
    mkdir -p ./neo4j_data/data ./neo4j_data/logs ./neo4j_data/import ./neo4j_data/plugins
    mkdir -p ./weaviate_data
    mkdir -p ./redis_data
    ```
    (Docker will create them if they don't exist when mounting volumes, but it's good practice to have them).
3.  **Run `docker-compose down -v`** to stop and remove any old containers and their anonymous volumes.
4.  **Run `docker-compose up -d --build`**.
5.  **Monitor the logs:**
    *   `docker-compose logs -f postgres`
    *   `docker-compose logs -f neo4j`
    *   `docker-compose logs -f weaviate`
    *   `docker-compose logs -f redis`
    *   `docker-compose logs -f api-gateway`
    Look for successful startup messages and any connection errors from `api-gateway` to the databases.

This should give you a complete, multi-database local development environment managed by Docker Compose, with configurations driven by your root `.env` file.

That's great news that PostgreSQL is up and running smoothly! Adding the other databases (Neo4j, Weaviate, and Redis) to your `docker-compose.yml` follows a very similar pattern. You've already got most of it in the `docker-compose.yml` snippet you shared earlier.

The key is to ensure:
1.  You use the official Docker images for each database.
2.  You map persistent volumes so data isn't lost when containers stop/restart.
3.  You expose the necessary ports from the container to your host machine for local access (e.g., by tools like Neo4j Browser or Prisma Studio connecting to Postgres).
4.  You configure necessary environment variables for each database, especially for authentication and basic setup, sourcing these from your root `.env` file.
5.  All services are on the same Docker network (`2d1l_network`) so they can communicate with each other using their service names as hostnames.

Let's refine the `docker-compose.yml` specifically for adding/confirming Neo4j, Weaviate, and Redis, ensuring they use the environment variables we've discussed for your root `.env` file.

**Your Updated `docker-compose.yml` (Focusing on adding/verifying Neo4j, Weaviate, Redis):**

```yaml
# docker-compose.yml
# No version needed at the top for modern Docker Compose

networks:
  2d1l_network:
    external: true # Reminder: Run 'docker network create 2d1l_network' once manually if it doesn't exist.

services:
  postgres: # You confirmed this is working
    image: postgres:15
    container_name: postgres-2d1l
    ports:
      - "${POSTGRES_HOST_PORT:-5433}:5432" # Host:Container
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB_NAME}
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
    networks:
      - 2d1l_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  neo4j:
    image: neo4j:5.18 # Specify a recent, stable version
    container_name: neo4j-2d1l
    ports:
      - "${NEO4J_HTTP_HOST_PORT:-7474}:7474"   # For Neo4j Browser
      - "${NEO4J_BOLT_HOST_PORT:-7687}:7687"    # For application connections
    networks:
      - 2d1l_network
    environment:
      # NEO4J_AUTH format is user/password
      NEO4J_AUTH: "${NEO4J_USER:-neo4j}/${NEO4J_PASSWORD:-password123}" # Ensure NEO4J_USER and NEO4J_PASSWORD are in your .env
      # Optional: Increase memory if needed, especially for graph algorithms later
      # NEO4J_server_memory_heap_initial__size: "512m"
      # NEO4J_server_memory_heap_max__size: "2G"
    volumes:
      - ./neo4j_data/data:/data             # Mounts the data directory
      - ./neo4j_data/logs:/logs             # Mounts the logs directory
      - ./neo4j_data/import:/var/lib/neo4j/import # For CSV imports if needed
      - ./neo4j_data/plugins:/plugins       # For APOC or other plugins
    restart: unless-stopped
    healthcheck: # Basic healthcheck for Neo4j
      test: ["CMD-SHELL", "wget --spider -q http://localhost:7474 || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s # Give Neo4j time to start up

  weaviate:
    image: semitechnologies/weaviate:1.25.3 # Or latest stable
    container_name: weaviate-2d1l
    ports:
      - "${WEAVIATE_HOST_PORT:-8080}:8080" # HTTP
      - "50051:50051"                     # gRPC
    networks:
      - 2d1l_network
    environment:
      QUERY_DEFAULTS_LIMIT: "25"
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: "true" # For local dev; consider auth for staging/prod
      DEFAULT_VECTORIZER_MODULE: "none" # As per our decision
      ENABLE_MODULES: ""                # No inference modules needed if vectorizer is none
      PERSISTENCE_DATA_PATH: "/var/lib/weaviate"
      CLUSTER_HOSTNAME: 'node1' # Important for Weaviate
      # GOOGLE_API_KEY: "${GOOGLE_API_KEY}" # Only needed if Weaviate itself were doing Gemini embeddings
    volumes:
      - ./weaviate_data:/var/lib/weaviate
    restart: on-failure:0 # Or 'unless-stopped'
    healthcheck: # Basic healthcheck for Weaviate
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/v1/.well-known/ready"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s # Give Weaviate time to start

  redis:
    image: redis:7-alpine # Using a specific alpine version for smaller size
    container_name: redis-2d1l
    ports:
      - "${REDIS_HOST_PORT:-6379}:6379"
    networks:
      - 2d1l_network
    # If you set REDIS_PASSWORD in .env, uncomment and use it here:
    # command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - ./redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  api-gateway: # Assuming this is your main backend app for now
    build:
      context: . # Build from the monorepo root
      dockerfile: ./apps/api-gateway/Dockerfile
    container_name: api-gateway-2d1l
    ports:
      - "${API_GATEWAY_HOST_PORT:-3001}:${API_GATEWAY_CONTAINER_PORT:-3001}"
    depends_on:
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_healthy # Changed to service_healthy assuming healthcheck works
      weaviate:
        condition: service_healthy # Changed to service_healthy
      redis:
        condition: service_healthy
    networks:
      - 2d1l_network
    environment:
      - PORT=${API_GATEWAY_CONTAINER_PORT:-3001}
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST_FOR_APP_IN_DOCKER}:${POSTGRES_PORT_FOR_APP_IN_DOCKER}/${POSTGRES_DB_NAME}
      - NEO4J_URI=${NEO4J_URI_DOCKER} # e.g., neo4j://neo4j:7687
      - NEO4J_USERNAME=${NEO4J_USER}
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
      - WEAVIATE_SCHEME=${WEAVIATE_SCHEME:-http} # Default to http if not in .env
      - WEAVIATE_HOST=${WEAVIATE_HOST_DOCKER}     # e.g., weaviate:8080
      - REDIS_HOST=${REDIS_HOST_DOCKER:-redis}
      - REDIS_PORT=${REDIS_CONTAINER_PORT:-6379}
      # - REDIS_PASSWORD=${REDIS_PASSWORD} # Uncomment if used
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-1d}
      - NODE_ENV=${NODE_ENV:-development}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      # - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
    # volumes: # For development hot-reloading if your Dockerfile doesn't handle it
    #   - ./apps/api-gateway/src:/usr/src/app/src
    #   - /usr/src/app/node_modules # Prevent host node_modules overwriting container's
    restart: unless-stopped

  # Add cognitive-hub service similarly if it's a separate Dockerized service
  # cognitive-hub:
  #   build:
  #     context: .
  #     dockerfile: ./services/cognitive-hub/Dockerfile
  #   container_name: cognitive-hub-2d1l
  #   # ... similar environment variables and depends_on as api-gateway for DBs ...
  #   networks:
  #     - 2d1l_network
  #   restart: unless-stopped

# Define persistent named volumes (optional, Docker creates anonymous ones by default for ./paths)
# volumes:
#   postgres_data:
#   neo4j_data_data: # neo4j image uses /data
#   neo4j_data_logs:
#   neo4j_data_import:
#   neo4j_data_plugins:
#   weaviate_data:
#   redis_data:
```

**Explanation of Key Parts for New Databases:**

*   **`neo4j` service:**
    *   `image: neo4j:5.18`: Using a specific recent version.
    *   `ports`:
        *   `"${NEO4J_HTTP_HOST_PORT:-7474}:7474"`: Maps the Neo4j Browser HTTP port (7474 inside container) to a host port (default 7474, configurable via `.env`).
        *   `"${NEO4J_BOLT_HOST_PORT:-7687}:7687"`: Maps the Bolt protocol port (7687 inside container) for application connections.
    *   `environment`:
        *   `NEO4J_AUTH: "${NEO4J_USER:-neo4j}/${NEO4J_PASSWORD:-password123}"`: Sets the username and password. **Ensure `NEO4J_USER` and `NEO4J_PASSWORD` are in your root `.env` file.**
    *   `volumes`:
        *   `./neo4j_data/data:/data`: Persists the graph data.
        *   `./neo4j_data/logs:/logs`: Persists logs.
        *   `./neo4j_data/import:/var/lib/neo4j/import`: For bulk data import if needed.
        *   `./neo4j_data/plugins:/plugins`: For Neo4j plugins like APOC.
    *   `healthcheck`: A simple check to see if the HTTP interface is up. `start_period` gives Neo4j time to initialize.

*   **`weaviate` service:**
    *   `image: semitechnologies/weaviate:1.25.3`: Using the version specified.
    *   `ports`:
        *   `"${WEAVIATE_HOST_PORT:-8080}:8080"`: Maps Weaviate's HTTP API port.
        *   `"50051:50051"`: For gRPC.
    *   `environment`:
        *   `DEFAULT_VECTORIZER_MODULE: "none"`: **Crucial** as per our decision to use external embeddings.
        *   `AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'`: For local development simplicity. Disable for production.
        *   `CLUSTER_HOSTNAME: 'node1'`: Important for Weaviate.
    *   `volumes`: `./weaviate_data:/var/lib/weaviate` for persistence.
    *   `healthcheck`: Checks the `/v1/.well-known/ready` endpoint.

*   **`redis` service:**
    *   `image: redis:7-alpine`: A specific, lightweight version.
    *   `ports`: `"${REDIS_HOST_PORT:-6379}:6379"`
    *   `command`: Commented out, but shows how to set a password if `REDIS_PASSWORD` is defined in your `.env`.
    *   `volumes`: `./redis_data:/data` for persistence (if Redis persistence is enabled in its config).
    *   `healthcheck`: Uses `redis-cli ping`.

*   **`depends_on` in `api-gateway` (and potentially `cognitive-hub`):**
    *   Updated to include `neo4j`, `weaviate`, and `redis` with `condition: service_healthy` (if healthcheck is robust) or `condition: service_started`. This helps ensure databases are at least starting before the application tries to connect.

**Steps for You to Take:**

1.  **Ensure your root `.env` file is comprehensive and includes all the variables referenced with `${...}` in the `docker-compose.yml` above.**
    *   Specifically, ensure `NEO4J_USER`, `NEO4J_PASSWORD`, `WEAVIATE_HOST_PORT`, `REDIS_HOST_PORT`, `API_GATEWAY_CONTAINER_PORT` and all the `*_DOCKER` and `*_LOCAL_CLI` / `*_HOST` variables are defined.
2.  **Create the local data directories if they don't exist:**
    ```bash
    mkdir -p ./neo4j_data/data ./neo4j_data/logs ./neo4j_data/import ./neo4j_data/plugins
    mkdir -p ./weaviate_data
    mkdir -p ./redis_data
    ```
    (Docker will create them if they don't exist when mounting volumes, but it's good practice to have them).
3.  **Run `docker-compose down -v`** to stop and remove any old containers and their anonymous volumes.
4.  **Run `docker-compose up -d --build`**.
5.  **Monitor the logs:**
    *   `docker-compose logs -f postgres`
    *   `docker-compose logs -f neo4j`
    *   `docker-compose logs -f weaviate`
    *   `docker-compose logs -f redis`
    *   `docker-compose logs -f api-gateway`
    Look for successful startup messages and any connection errors from `api-gateway` to the databases.

This should give you a complete, multi-database local development environment managed by Docker Compose, with configurations driven by your root `.env` file.

Ah, you've encountered two separate issues here: one with the Cypher syntax for constraints in Neo4j 5.x and another with how your shell is handling environment variables when using `docker exec`.

Let's address them.

**Issue 1: Neo.ClientError.Statement.SyntaxError in Neo4j Browser**

The error message is very clear:
`Neo.ClientError.Statement.SyntaxError: Invalid constraint syntax, ON and ASSERT should not be used. Replace ON with FOR and ASSERT with REQUIRE. (line 1, column 1 (offset: 0))`

This means the syntax for creating constraints has changed in Neo4j 5.x (which your `neo4j:5.18` image uses) compared to older versions.

*   **Old syntax (Neo4j 4.x and earlier):** `CREATE CONSTRAINT constraint_name IF NOT EXISTS ON (n:Label) ASSERT n.property IS UNIQUE`
*   **New syntax (Neo4j 5.x onwards):** `CREATE CONSTRAINT constraint_name IF NOT EXISTS FOR (n:Label) REQUIRE n.property IS UNIQUE`

**Solution for Issue 1: Update Cypher Syntax in `schema.cypher`**

You (or the AI agent) need to update all the `CREATE CONSTRAINT` statements in your `packages/database/src/neo4j/schema.cypher` file.

**Corrected `schema.cypher` Content:**

```cypher
// packages/database/src/neo4j/schema.cypher
// V7 Schema for Neo4j - CORRECTED SYNTAX FOR NEO4J 5.x

// --- Constraints (Ensure Uniqueness) ---

// User Node
CREATE CONSTRAINT user_userId_unique IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE;

// MemoryUnit Node
CREATE CONSTRAINT memoryUnit_muid_unique IF NOT EXISTS FOR (mu:MemoryUnit) REQUIRE mu.muid IS UNIQUE;

// Concept Node
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE;

// DerivedArtifact Node
CREATE CONSTRAINT derivedArtifact_id_unique IF NOT EXISTS FOR (da:DerivedArtifact) REQUIRE da.id IS UNIQUE;

// Media Node (Uncomment and adjust if you model Media as nodes in Neo4j)
// CREATE CONSTRAINT media_id_unique IF NOT EXISTS FOR (md:Media) REQUIRE md.id IS UNIQUE;

// Annotation Node (Uncomment and adjust if you model Annotations as nodes)
// CREATE CONSTRAINT annotation_aid_unique IF NOT EXISTS FOR (an:Annotation) REQUIRE an.aid IS UNIQUE;

// Community Node
CREATE CONSTRAINT community_communityId_unique IF NOT EXISTS FOR (com:Community) REQUIRE com.community_id IS UNIQUE;

// Tag Node (Uncomment and adjust if you have a dedicated Tag node)
// CREATE CONSTRAINT tag_id_unique IF NOT EXISTS FOR (t:Tag) REQUIRE t.id IS UNIQUE;
// CREATE CONSTRAINT tag_name_unique IF NOT EXISTS FOR (t:Tag) REQUIRE t.name IS UNIQUE;


// --- Indexes (For Query Performance) ---
// Index creation syntax remains largely the same or is often automatically created with uniqueness constraints for the exact property.
// However, explicit indexes can still be useful for non-unique properties or for existence constraints.

// User Node
CREATE INDEX user_userId_idx IF NOT EXISTS FOR (u:User) ON (u.userId); // Often redundant if unique constraint exists, but harmless

// MemoryUnit Node
CREATE INDEX memoryUnit_muid_idx IF NOT EXISTS FOR (mu:MemoryUnit) ON (mu.muid); // Redundant with constraint
CREATE INDEX memoryUnit_userId_idx IF NOT EXISTS FOR (mu:MemoryUnit) ON (mu.userId);
CREATE INDEX memoryUnit_creationTs_idx IF NOT EXISTS FOR (mu:MemoryUnit) ON (mu.creation_ts);
CREATE INDEX memoryUnit_sourceType_idx IF NOT EXISTS FOR (mu:MemoryUnit) ON (mu.source_type);

// Concept Node
CREATE INDEX concept_id_idx IF NOT EXISTS FOR (c:Concept) ON (c.id); // Redundant with constraint
CREATE INDEX concept_userId_idx IF NOT EXISTS FOR (c:Concept) ON (c.userId);
CREATE INDEX concept_name_idx IF NOT EXISTS FOR (c:Concept) ON (c.name);
CREATE INDEX concept_type_idx IF NOT EXISTS FOR (c:Concept) ON (c.type);
CREATE INDEX concept_communityId_idx IF NOT EXISTS FOR (c:Concept) ON (c.community_id);

// DerivedArtifact Node
CREATE INDEX derivedArtifact_id_idx IF NOT EXISTS FOR (da:DerivedArtifact) ON (da.id); // Redundant with constraint
CREATE INDEX derivedArtifact_userId_idx IF NOT EXISTS FOR (da:DerivedArtifact) ON (da.userId);
CREATE INDEX derivedArtifact_type_idx IF NOT EXISTS FOR (da:DerivedArtifact) ON (da.artifact_type);

// Community Node
CREATE INDEX community_communityId_idx IF NOT EXISTS FOR (com:Community) ON (com.community_id); // Redundant with constraint
CREATE INDEX community_userId_idx IF NOT EXISTS FOR (com:Community) ON (com.userId);
CREATE INDEX community_name_idx IF NOT EXISTS FOR (com:Community) ON (com.name);

// Example for a relationship property index (syntax varies slightly based on Neo4j version for relationship indexes)
// For Neo4j 5.x, relationship property indexes are usually created like this:
// CREATE INDEX rel_highlights_weight_idx IF NOT EXISTS FOR ()-[r:HIGHLIGHTS]-() ON (r.weight);
// Note: Full-text schema indexes are different and more powerful for text searching on properties.
```

**Action for You:** Replace the content of your `packages/database/src/neo4j/schema.cypher` with the corrected version above. Then try running it in Neo4j Browser again.

---

**Issue 2: `cypher-shell: error: argument -u/--username: expected one argument`**

*   **Log Snippet:**
    ```bash
    danniwang@Dannis-MacBook-Pro 2D1L % docker exec -i neo4j-2d1l cypher-shell -u ${NEO4J_USER} -p ${NEO4J_PASSWORD} < ./packages/database/src/neo4j/schema.cypher
    usage: cypher-shell [-h] [-a ADDRESS] [-u USERNAME] [--impersonate IMPERSONATE] [-p PASSWORD]
                        [--encryption {true,false,default}] [-d DATABASE]
                        [--format {auto,verbose,plain}] [-P PARAM] [--non-interactive]
                        [--sample-rows SAMPLE-ROWS] [--wrap {true,false}] [-v] [--driver-version]
                        [-f FILE] [--change-password] [--log [LOG-FILE]] [--history HISTORY-BEHAVIOUR]
                        [--notifications] [--fail-fast | --fail-at-end] [cypher]
    cypher-shell: error: argument -u/--username: expected one argument
    ```
*   **Cause:** Your shell (zsh) is not substituting the environment variables `${NEO4J_USER}` and `${NEO4J_PASSWORD}` within the `docker exec` command string when they are directly part of the command execution. `cypher-shell` is literally seeing `-u ${NEO4J_USER}` and thus complains that `${NEO4J_USER}` is not a valid username.
*   **Solution:** You need to ensure the variables are expanded *before* `cypher-shell` receives them, or pass them in a way `docker exec` can handle.

**How to Fix the `docker exec` command:**

**Option A (Pass variables explicitly):**
This is often the most reliable way.
```bash
NEO4J_USER_ENV=$(grep NEO4J_USER .env | cut -d '=' -f2)
NEO4J_PASSWORD_ENV=$(grep NEO4J_PASSWORD .env | cut -d '=' -f2)
docker exec -i neo4j-2d1l cypher-shell -u "$NEO4J_USER_ENV" -p "$NEO4J_PASSWORD_ENV" < ./packages/database/src/neo4j/schema.cypher
```
*(This assumes `NEO4J_USER` and `NEO4J_PASSWORD` are defined in your root `.env` file. Adjust the grep if needed or just hardcode for a one-time run if simpler, but using env vars is better practice).*

**Option B (Using `env` with `docker exec` - might not work for password prompts):**
Sometimes you can pass environment variables directly to the `exec` command, but `cypher-shell` might not pick them up for `-u` and `-p` flags directly.

**Option C (Simpler for one-time execution, if variables are in your current shell):**
If `NEO4J_USER` and `NEO4J_PASSWORD` are already exported in your current terminal session (e.g., you did `source .env` or set them manually), then ensure you use double quotes for the expansion if the password contains special characters:
```bash
docker exec -i neo4j-2d1l cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" < ./packages/database/src/neo4j/schema.cypher
```

**Recommendation for `docker exec`:**
Try **Option A** first as it's explicit. If your `.env` is sourced, Option C might work.

**Summary of Next Steps for You (Human Operator):**

1.  **Edit `packages/database/src/neo4j/schema.cypher`:** Replace its content with the corrected Cypher syntax provided above.
2.  **Ensure Neo4j Docker Container is Running:** `docker-compose up -d neo4j`
3.  **Apply the Corrected `schema.cypher`:**
    *   **Either** via Neo4j Browser (copy-paste and run).
    *   **Or** via the corrected `docker exec` command (Option A is recommended):
        ```bash
        # Make sure your .env file has:
        # NEO4J_USER=neo4j
        # NEO4J_PASSWORD=password123 (or your actual password)

        NEO4J_USER_VAL=$(grep '^NEO4J_USER=' .env | cut -d '=' -f2)
        NEO4J_PASSWORD_VAL=$(grep '^NEO4J_PASSWORD=' .env | cut -d '=' -f2)

        echo "Using Neo4j User: $NEO4J_USER_VAL" # For verification

        docker exec -i neo4j-2d1l cypher-shell -u "$NEO4J_USER_VAL" -p "$NEO4J_PASSWORD_VAL" < ./packages/database/src/neo4j/schema.cypher
        ```
4.  **Verify in Neo4j Browser:** Use `SHOW CONSTRAINTS;` and `SHOW INDEXES;` to confirm they were created.

Once these Neo4j schema elements are correctly in place, your backend services (like `IngestionAnalyst` and `RetrievalPlanner`) will be able to interact with Neo4j more reliably.
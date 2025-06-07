# 2dots1line V7 - User Manual - 20250605

## Quick Start Guide

This manual covers how to start the entire system from scratch and test the authentication functionality.

## Prerequisites

1. **Node.js**: Version 18.0.0 or higher
2. **pnpm**: Package manager
3. **Docker**: For databases (PostgreSQL, Neo4j, Weaviate, Redis)

## Initial Setup

### 1. Install Dependencies

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install all project dependencies
pnpm install
```

### 2. Environment Setup

Ensure your `.env` file contains the correct database URLs:

```bash
# PostgreSQL Configuration
POSTGRES_USER=danniwang
POSTGRES_PASSWORD=MaxJax2023@
POSTGRES_HOST_PORT=5433
POSTGRES_DB=twodots1line
DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"

# Other database configurations should be present as well
```

### 3. Database Setup

#### Start Docker Services
```bash
# Make sure Docker Desktop is running
open -a Docker

# Wait for Docker to start, then check if containers are running
docker ps

# If you need to start the database containers:
docker-compose up -d
```

#### Run Database Migrations
```bash
cd packages/database
npx prisma migrate deploy
npx prisma generate
cd ../..
```

## Building the Project

### 1. Build Core Packages
```bash
# Build database package first
turbo run build --filter=@2dots1line/database

# Build other core packages
turbo run build --filter=@2dots1line/shared-types
turbo run build --filter=@2dots1line/core-utils
```

### 2. Build Services
```bash
# Build API Gateway
turbo run build --filter=@2dots1line/api-gateway

# Build Web App
turbo run build --filter=@2dots1line/web-app
```

## Starting Services

### 1. Start API Gateway (Backend)
```bash
cd apps/api-gateway
pnpm dev
```

**Expected Output:**
- "API Gateway is running on port 3001"
- Database connections should be successful

### 2. Start Web App (Frontend)
```bash
# In a new terminal
cd apps/web-app
pnpm dev
```

**Expected Output:**
- "Ready in [time]ms"
- "Local: http://localhost:3000"

## Testing the Authentication System

### 1. Test API Endpoints Directly

**Test Registration:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","name":"Test User"}'
```

**Test Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

### 2. Test Frontend

1. Navigate to `http://localhost:3000`
2. Click "Sign up" button
3. Fill in the registration form:
   - Name: Your Name
   - Email: your-email@example.com
   - Password: YourPassword123
   - Confirm Password: YourPassword123
4. Click "Create Account"
5. You should be automatically logged in
6. The page should show "Welcome back, [Your Name]"
7. You should see a "Log out" button instead of "Log in"/"Sign up"

### 3. Verify User Creation in Database

#### Using Prisma Studio (Recommended)
```bash
cd packages/database
npx prisma studio
```

1. Prisma Studio will open in your browser (usually http://localhost:5555)
2. Click on the "User" table
3. You should see your newly created user with:
   - `user_id`: UUID
   - `email`: The email you registered with
   - `name`: The name you provided
   - `created_at`: Timestamp when you registered
   - `account_status`: "active"

#### Using Direct Database Query
```bash
# Connect to PostgreSQL directly
docker exec -it [postgres-container-name] psql -U danniwang -d twodots1line

# Query users
SELECT user_id, email, name, created_at, account_status FROM "User";
```

## Service Ports

- **Web App (Frontend)**: http://localhost:3000
- **API Gateway (Backend)**: http://localhost:3001
- **Cognitive Hub (if needed)**: http://localhost:8000
- **Prisma Studio**: http://localhost:5555
- **PostgreSQL**: localhost:5433
- **Neo4j**: localhost:7687 (Bolt), localhost:7474 (Browser)
- **Weaviate**: localhost:8080
- **Redis**: localhost:6379

## Troubleshooting

### Common Issues

#### 1. Authentication State Not Updating After Login
**Symptoms**: UI still shows "Log in/Sign up" buttons after successful login
**Root Cause**: UserStore configured for wrong API port or authentication state not initialized
**Solution**: 
```bash
# Ensure API Gateway is running on port 3001 (not 8000)
cd apps/api-gateway && pnpm dev

# Verify UserStore.ts uses correct API_BASE_URL
# Should be: http://localhost:3001 (not 8000)

# Check if authentication state is being initialized on app startup
# The useEffect in page.tsx should call initializeAuth()
```

#### 2. UI Components Have No Styling (Plain Text Buttons)
**Symptoms**: Buttons appear as plain text, no glassmorphism effects, poor spacing
**Root Cause**: Tailwind not processing ui-components package
**Solution**: 
```javascript
// In apps/web-app/tailwind.config.js, ensure content includes:
content: [
  './src/app/**/*.{js,ts,jsx,tsx}',
  './src/components/**/*.{js,ts,jsx,tsx}',
  '../../packages/ui-components/src/**/*.{js,ts,jsx,tsx}', // This line is critical
],
```

#### 3. Database Connection Errors
```bash
# Check if Docker containers are running
docker ps

# Check database connectivity
nc -zv localhost 5433

# Restart Docker containers if needed
docker-compose down && docker-compose up -d
```

#### 4. Port Already in Use
```bash
# Find and kill processes using specific ports
lsof -i :3000  # or :8000, :5433, etc.
pkill -f "process-name"

# Kill zombie Node.js processes
ps aux | grep node | grep -v grep
kill -9 [PID]
```

#### 5. Multiple Conflicting Processes
**Symptoms**: EADDRINUSE errors, services not responding
**Solution**: 
```bash
# Kill all Node.js development processes
pkill -f "ts-node-dev"
pkill -f "next dev"

# Restart services cleanly
cd apps/api-gateway && PORT=8000 pnpm dev
cd apps/web-app && pnpm dev
```

#### 6. Environment Variables Not Loading
```bash
# Ensure .env file exists and has correct format
# DATABASE_URL should be fully resolved, not use variable substitution
DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
```

#### 7. UI Components Build Issues
```bash
# Clean and rebuild ui-components
cd packages/ui-components
rm -rf dist
pnpm run build

# Restart web app after rebuilding
cd apps/web-app
pkill -f "next dev"
pnpm dev
```

#### 8. Prisma Issues
```bash
# Regenerate Prisma client
cd packages/database
npx prisma generate
npx prisma migrate reset  # WARNING: This will delete all data
```

### Verification Steps

After fixing issues, verify the system works:

1. **Backend Test**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"uitest@example.com","password":"password123"}'
   ```

2. **Frontend Test**:
   - Navigate to http://localhost:3000
   - Click "Sign up" - modal should appear with proper glassmorphism styling
   - Register a new user
   - UI should update to show "Welcome back, [Name]" and "Log out" button

3. **Database Test**:
   ```bash
   cd packages/database && npx prisma studio
   # Check User table for new entries
   ```

## Development Workflow

### Starting Fresh Development Session

1. **Start Docker** (if not running):
   ```bash
   open -a Docker
   # Wait for Docker to start
   ```

2. **Start Database Services**:
   ```bash
   docker ps  # Check if containers are running
   # If not running: docker-compose up -d
   ```

3. **Start API Gateway**:
   ```bash
   cd apps/api-gateway
   PORT=8000 pnpm dev
   ```

4. **Start Web App** (in new terminal):
   ```bash
   cd apps/web-app
   pnpm dev
   ```

5. **Open Prisma Studio** (optional, in new terminal):
   ```bash
   cd packages/database
   npx prisma studio
   ```

### Testing End-to-End Authentication

1. Open http://localhost:3000
2. Click "Sign up"
3. Register a new user
4. Verify login works
5. Check user appears in Prisma Studio
6. Test logout functionality

## File Structure Reference

```
2D1L/
├── apps/
│   ├── api-gateway/          # Backend API (Port 8000)
│   └── web-app/             # Frontend Next.js app (Port 3000)
├── packages/
│   ├── database/            # Prisma schema and migrations
│   ├── shared-types/        # TypeScript type definitions
│   └── ...
├── .env                     # Environment variables
├── docker-compose.yml       # Database containers
└── package.json            # Root package.json
```

## Security Notes

- JWT tokens expire in 7 days
- Passwords are hashed with bcrypt (12 salt rounds)
- CORS is configured for localhost development
- Environment variables contain sensitive data - never commit to git

## Next Steps

After confirming authentication works:
1. Test the modal interactions
2. Verify JWT token persistence
3. Test login/logout state management
4. Explore the glassmorphism UI design
5. Check responsive design on different screen sizes

## Support

If you encounter issues:
1. Check the terminal logs for error messages
2. Verify all services are running on their expected ports
3. Confirm database connectivity
4. Review the troubleshooting section above
5. Check that all environment variables are properly set 

## Architecture Overview

### Hybrid Development Approach

The 2dots1line V7 system uses a **hybrid architecture** for local development:

**Databases (Containerized):**
- PostgreSQL: Docker container on port 5433
- Neo4j: Docker container on ports 7687/7474  
- Weaviate: Docker container on port 8080
- Redis: Docker container on port 6379

**Application Services (Local):**
- API Gateway: Local Node.js process on port 8000
- Web App: Local Next.js process on port 3000
- Prisma Studio: Local process on port 5555

### Why This Approach?

1. **Database Consistency**: Docker ensures consistent database versions and configurations across all developers
2. **Development Flexibility**: Local application processes allow for:
   - Faster hot reloading and debugging
   - Direct access to source code and logs
   - Easy IDE integration and breakpoint debugging
   - No container build overhead during development

3. **Port Management**: 
   - Databases use non-standard ports (5433 vs 5432) to avoid conflicts with local installations
   - Application services use standard development ports (3000, 8000)

### Development vs Production

- **Development**: Hybrid approach (databases in Docker, apps local)
- **Production**: Fully containerized (all services in containers)

### Docker Container Management

The Docker containers should remain running throughout development:
```bash
# Check container status
docker ps

# Start all databases
docker-compose up -d

# Stop all databases (only when needed)
docker-compose down
```

**Important**: Don't stop Docker containers unless troubleshooting - they're designed to run continuously during development. 


## AI diagnostic commands

# Check what's actually in the database
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L

# Check conversations (this should have data)
npx prisma studio
# Or via SQL:
psql -h localhost -U your_username -d your_database -c "SELECT COUNT(*) FROM conversations;"

# Check sessions (this will be empty - that's normal)
psql -h localhost -U your_username -d your_database -c "SELECT COUNT(*) FROM sessions;"


Excellent! 🎉 Let me help you with those three questions:

## **1. Safe to Remove cognitive-hub/src/tools Subdirectories**

**YES, it's safe to remove the tool subdirectories, but let me guide you through what to check first:**

**Check what's currently there:**
```bash
ls -la /Users/danniwang/Documents/GitHub/202506062D1L/2D1L/services/cognitive-hub/src/tools/
```

**What you should see and can safely remove:**
- `llm-tools/` directory (moved to `packages/ai-clients`)
- `document-tools/` directory (moved to `packages/document-tool`) 
- `text-tools/` directory (moved to `packages/text-tool`)
- `vision-tools/` directory (moved to `packages/vision-tool`)

**What you should KEEP:**
- `index.ts` file (this imports from packages and registers tools)

**Safe removal commands:**
```bash
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L/services/cognitive-hub/src/tools/
rm -rf llm-tools/
rm -rf document-tools/
rm -rf text-tools/
rm -rf vision-tools/
# Keep index.ts!
```

## **2. Updating the System Prompt**

**File location:** `/Users/danniwang/Documents/GitHub/202506062D1L/2D1L/services/cognitive-hub/config/dot_system_prompt.json`

**To reflect changes after editing:**
```bash
# You need to restart the API Gateway
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L
pkill -f "api-gateway"
sleep 3
cd apps/api-gateway && pnpm dev
```

**Why:** The DialogueAgent loads the system prompt once during initialization in its constructor. It doesn't watch for file changes, so you need to restart the service.

**Pro tip:** You can also just edit the JSON file and test immediately - the changes will take effect on the next API Gateway restart.

## **3. Viewing Data in Weaviate and Neo4j**

### **Weaviate Data Exploration:**

**Option A: Weaviate Console (Web UI)**
```bash
# Weaviate should be running on port 8080
open http://localhost:8080/v1/meta
```

**Option B: Query via API**
```bash
# See all classes
curl http://localhost:8080/v1/schema

# Query UserMemory objects
curl "http://localhost:8080/v1/objects?class=UserMemory&limit=10"

# Query ConversationChunk objects  
curl "http://localhost:8080/v1/objects?class=ConversationChunk&limit=10"
```

**Option C: Weaviate Client Console (if installed)**
```bash
pip install weaviate-client
python3 -c "
import weaviate
client = weaviate.Client('http://localhost:8080')
print('Schema:', client.schema.get())
print('UserMemory count:', client.query.aggregate('UserMemory').with_meta_count().do())
"
```

### **Neo4j Data Exploration:**

**Option A: Neo4j Browser (Web UI)**
```bash
# Open Neo4j Browser
open http://localhost:7474/browser/
# Login: neo4j / password (check your .env file)
```

**Option B: Cypher Queries via Browser**
```cypher
# See all node labels
CALL db.labels() YIELD label RETURN label;

# See all relationship types
CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType;

# Count all nodes
MATCH (n) RETURN count(n);

# See sample data (first 25 nodes)
MATCH (n) RETURN n LIMIT 25;

# See user concepts
MATCH (c:Concept) RETURN c LIMIT 10;

# See memories and relationships
MATCH (m:Memory)-[r]->(c:Concept) RETURN m, r, c LIMIT 10;
```

**Option C: Command Line (if neo4j client installed)**
```bash
# If you have cypher-shell installed
cypher-shell -a bolt://localhost:7687 -u neo4j -p yourpassword
```

### **Quick Data Check Commands:**

**See if data is being created:**
```bash
# Check Weaviate objects
curl -s "http://localhost:8080/v1/objects?limit=5" | jq '.objects | length'

# Check Neo4j nodes  
echo "MATCH (n) RETURN count(n);" | cypher-shell -a bolt://localhost:7687 -u neo4j -p yourpassword
```

**Expected to see:**
- **Weaviate**: UserMemory, ConversationChunk, UserConcept, UserArtifact objects
- **Neo4j**: User, Memory, Concept nodes with relationships

The data should start appearing after you have meaningful conversations with Dot (the IngestionAnalyst creates memories when conversations are deemed "memory-worthy").

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
- **Neo4j**: localhost:7688 (Bolt), localhost:7475 (Browser)
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
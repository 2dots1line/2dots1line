# Startup Guide

This guide outlines the steps to start the notification system after running `pnpm build`.

## Prerequisites

- All packages have been built successfully with `pnpm build`
- Docker Desktop is installed and running
- PostgreSQL is installed locally
- All dependencies are installed

## Step-by-Step Startup Process

### 1. Start Docker Desktop

Ensure Docker Desktop is running on your system.

### 2. Start Required Docker Containers

Start the required services (Redis, Neo4j, Weaviate, and Dimension Reducer):

```bash
docker-compose up -d
```

If containers already exist but are stopped, start them:

```bash
docker-compose start
```

**Required Containers:**
- Redis (caching and session storage)
- Neo4j (graph database)
- Weaviate (vector database)
- Dimension Reducer (ML service)

### 3. Database Setup

Sync the database schema and generate the Prisma client:

```bash
# Sync database schema
npx prisma db push --schema=packages\database\prisma\schema.prisma

# Generate Prisma client
npx prisma generate --schema=packages\database\prisma\schema.prisma
```

#### 3.1. Start Local PostgreSQL Database

**Step:** Boot Local PostgreSQL Server  
**Directory:** `D:\postgre\bin`

```powershell
cd "D:\postgre\bin"
& "D:\postgre\bin\postgres.exe" -D "D:\postgre\data" -p 5432
```

**Verify PostgreSQL is running:**
```powershell
# From: D:\postgre\bin
cd "D:\postgre\bin"
.\pg_ctl.exe -D "D:\postgre\data" status
```

#### 3.2. Start Prisma Studio

**Step:** Launch Database Management Interface  
**Directory:** `c:\Users\mrluf\Desktop\notification`

```powershell
# Set environment variable and start Prisma Studio
$env:DATABASE_URL="postgresql://danniwang:password123@localhost:5432/notification?schema=public"
cd packages\database
npx prisma studio --schema=prisma\schema.prisma
```

*Access Prisma Studio at: http://localhost:5555*

### 4. Start Backend Services

Start all backend services using PM2:

```bash
pm2 start ecosystem.config.js
```

### 5. Start Frontend Development Server

Start the frontend development server:

```bash
pnpm dev
```

## Quick Reference Commands

```bash
# Complete startup sequence
docker-compose up -d
npx prisma db push --schema=packages\database\prisma\schema.prisma
npx prisma generate --schema=packages\database\prisma\schema.prisma

# Start PostgreSQL (in separate terminal)
cd "D:\postgre\bin"
& "D:\postgre\bin\postgres.exe" -D "D:\postgre\data" -p 5432

# Start Prisma Studio (in separate terminal)
$env:DATABASE_URL="postgresql://danniwang:password123@localhost:5432/notification?schema=public"
cd packages\database
npx prisma studio --schema=prisma\schema.prisma

# Start services
pm2 start ecosystem.config.js
pnpm dev
```

## Verification Steps

### Check Docker Containers
```bash
docker ps
```
Ensure all required containers are running.

### Check PostgreSQL Status
```powershell
cd "D:\postgre\bin"
.\pg_ctl.exe -D "D:\postgre\data" status
```

### Check PM2 Services
```bash
pm2 status
```
Verify all services are online.

### Access the Application
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Prisma Studio: http://localhost:5555

## Troubleshooting

### PostgreSQL Issues
- **PostgreSQL won't start**: Check if port 5432 is available
- **Connection refused**: Verify PostgreSQL service is running
- **Data directory errors**: Ensure `D:\postgre\data` exists and has proper permissions

### Docker Issues
- **Containers not starting**: Check Docker Desktop is running
- **Port conflicts**: Ensure ports 6379 (Redis), 7687 (Neo4j), 8080 (Weaviate) are available
- **Container creation fails**: Run `docker-compose down` then `docker-compose up -d`

### Database Issues
- **Schema sync fails**: Check DATABASE_URL in .env file
- **Prisma client errors**: Re-run `npx prisma generate`
- **Connection errors**: Verify PostgreSQL and database containers are running
- **Prisma Studio connection issues**: Verify DATABASE_URL environment variable is set correctly

### PM2 Issues
- **Services fail to start**: Check logs with `pm2 logs`
- **Port conflicts**: Ensure required ports are available
- **Environment variables**: Verify .env file exists in root directory

### Frontend Issues
- **Build errors**: Ensure all packages are built with `pnpm build`
- **Port conflicts**: Default port 3000, change in next.config.js if needed
- **Module not found**: Re-run `pnpm install`

## Stopping Services

### Stop Frontend
Press `Ctrl+C` in the terminal running `pnpm dev`

### Stop Prisma Studio
Press `Ctrl+C` in the terminal running Prisma Studio

### Stop Backend Services
```bash
pm2 stop all
```

### Stop PostgreSQL
```powershell
cd "D:\postgre\bin"
.\pg_ctl.exe -D "D:\postgre\data" stop
```

### Stop Docker Containers
```bash
docker-compose stop
```

### Complete Shutdown
```bash
pm2 stop all
docker-compose down
# Stop PostgreSQL
cd "D:\postgre\bin"
.\pg_ctl.exe -D "D:\postgre\data" stop
```

## Success Criteria

✅ All Docker containers are running  
✅ PostgreSQL server is running on port 5432  
✅ Database schema is synced  
✅ Prisma client is generated  
✅ Prisma Studio is accessible at http://localhost:5555  
✅ All PM2 services are online  
✅ Frontend development server is running  
✅ Application is accessible at http://localhost:3000  

## Notes

- PostgreSQL must be started before PM2 services
- The database sync step (`prisma db push`) is mandatory after pulling new changes
- Prisma Studio provides a visual interface for database management
- Always ensure Docker containers are running before starting PM2 services
- The frontend development server should be started last
- Check PM2 logs if any services fail to start: `pm2 logs [service-name]`
- Keep PostgreSQL and Prisma Studio running in separate terminal windows
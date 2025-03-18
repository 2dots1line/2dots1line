# 2Dots1Line Server Management Guide

This guide provides step-by-step instructions for starting, testing, and managing the 2Dots1Line application servers.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Starting the Servers](#starting-the-servers)
3. [Testing the Connections](#testing-the-connections)
4. [Troubleshooting Server Issues](#troubleshooting-server-issues)
5. [Monitoring AI Processing](#monitoring-ai-processing)
6. [Shutting Down Servers](#shutting-down-servers)

## System Requirements

- **Node.js**: v14+ for frontend
- **Python**: v3.9+ for backend
- **MongoDB**: Account and connection string
- **Ollama** (optional): For local AI processing

## Starting the Servers

### 1. Starting the Frontend Server

From the root directory of the project:

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:3000

### 2. Starting the Backend Server

From the project root:

```bash
# Navigate to backend directory
cd backend

# Create/activate virtual environment (if not already done)
# For macOS/Linux
python -m venv venv
source venv/bin/activate

# For Windows
# python -m venv venv
# venv\Scripts\activate

# Install requirements (if not already done)
pip install -r requirements.txt

# Start the backend server
uvicorn app:app --reload
```

The backend will be available at http://localhost:8000

### 3. Starting Ollama (Optional)

If you're using Ollama for local AI processing:

```bash
# In a new terminal window
ollama serve
```

Then pull your desired model:

```bash
ollama pull qwq:32B  # Or your chosen model
```

## Testing the Connections

### 1. Testing the Backend Server

Test the backend API health:

```bash
curl http://localhost:8000/health | python -m json.tool
```

You should see a JSON response with server health information, including MongoDB connection status and AI provider details.

### 2. Testing MongoDB Connection

Check MongoDB connection with:

```bash
curl http://localhost:8000/health | grep -A 10 mongodb
```

Look for `"status": "connected"` in the response.

### 3. Testing AI Provider

Test the AI connection:

```bash
# Test Ollama
curl http://localhost:8000/config/test-ollama | python -m json.tool

# Test OpenRouter
curl http://localhost:8000/test-openrouter | python -m json.tool

# Test a simple AI question
curl -X POST "http://localhost:8000/api/test/ask" \
  -H "Content-Type: application/json" \
  -d '{"question":"What is 2+2?"}' | python -m json.tool
```

### 4. Testing End-to-End with Frontend

1. Open http://localhost:3000 in your browser
2. Go to http://localhost:3000/test-ai
3. Enter a simple question and click "Ask Question"
4. You should receive a response from the AI

## Troubleshooting Server Issues

### Port Already in Use

If you see "Address already in use" when starting a server:

#### For Backend (Port 8000)

Find and kill the process:

```bash
# Find the process using port 8000
lsof -i :8000

# Kill the process (replace PID with the process ID from above)
kill PID

# If it doesn't respond to regular kill, use force kill
kill -9 PID
```

Or use a different port:

```bash
uvicorn app:app --reload --port 8001
```

#### For Frontend (Port 3000)

Find and kill the process:

```bash
# Find the process using port 3000
lsof -i :3000

# Kill the process
kill PID
```

### Using the Restart Scripts

For convenience, you can use the restart script:

```bash
# First make the script executable (if not already)
chmod +x restart-backend-venv.sh

# Then run it from the backend directory
./restart-backend-venv.sh
```

### MongoDB Connection Issues

If MongoDB isn't connecting:

1. Check your `.env` or `.env.local` file has the correct `MONGODB_URI`
2. Test connection manually:

```bash
python -c "import pymongo; client = pymongo.MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=5000); print(client.admin.command('ping'))"
```

### AI Provider Issues

If the AI provider isn't responding:

1. Switch to a different provider:

```bash
# Switch to Ollama
curl -X POST "http://localhost:8000/config/switch-provider/ollama"

# Switch to OpenRouter
curl -X POST "http://localhost:8000/config/switch-provider/openrouter"
```

2. Check Ollama is running (if using Ollama):

```bash
curl http://localhost:11434/api/tags
```

3. Try a smaller model in `.env`:

```
OLLAMA_MODEL=llama3  # Instead of qwq:32B
```

## Monitoring AI Processing

To monitor the processing of AI requests in real-time:

```bash
curl http://localhost:8000/api/status/ai-requests | python -m json.tool
```

This will show all current and recent AI requests, their status, and how long they've been running.

## Shutting Down Servers

### 1. Stopping the Backend Server

Press `Ctrl+C` in the terminal where the backend is running.

To ensure all processes are stopped:

```bash
# Find any lingering processes
lsof -i :8000

# Kill them if necessary
kill PID
```

### 2. Stopping the Frontend Server

Press `Ctrl+C` in the terminal where the frontend is running.

### 3. Stopping Ollama (if running)

Press `Ctrl+C` in the terminal where Ollama is running.

### 4. Deactivating the Virtual Environment

When you're done working with the backend:

```bash
deactivate
```

## Complete Restart Sequence

To fully restart all components:

```bash
# 1. Kill all existing servers
pkill -f "uvicorn app:app"
pkill -f "npm run dev"

# 2. Start backend
cd backend
source venv/bin/activate
uvicorn app:app --reload

# 3. In a new terminal, start frontend
cd /path/to/project
npm run dev
```

For a quick restart of just the backend:

```bash
cd backend
./restart-backend-venv.sh
``` 
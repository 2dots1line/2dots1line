#!/bin/bash

# Restart script for the 2Dots1Line backend server using the virtual environment
# This script will find and kill any processes using port 8000,
# then restart the backend server using the virtual environment's Python.

PORT=8000
echo "2Dots1Line Backend Restart Script (venv)"
echo "---------------------------------"

# Check if we're in the correct directory
if [ ! -f "app.py" ]; then
    echo "Error: app.py not found in current directory."
    echo "Please run this script from the backend directory."
    exit 1
fi

# Find process using port 8000
echo "Checking for processes using port $PORT..."
PID=$(lsof -ti :$PORT)

if [ -n "$PID" ]; then
    echo "Found process using port $PORT: PID $PID"
    echo "Killing process $PID..."
    kill -9 $PID
    if [ $? -eq 0 ]; then
        echo "Successfully killed process $PID"
    else
        echo "Warning: Could not kill process $PID. You may need to kill it manually."
        echo "Try: kill -9 $PID"
        exit 1
    fi
else
    echo "No process found using port $PORT"
fi

# Get virtual environment Python path
VENV_PYTHON="../.venv/bin/python"
VENV_UVICORN="../.venv/bin/uvicorn"

if [ ! -f "$VENV_PYTHON" ]; then
    echo "Error: Virtual environment Python not found at $VENV_PYTHON"
    echo "Make sure the virtual environment is activated and properly set up."
    exit 1
fi

# Start the backend server using virtual environment's Python and uvicorn
echo "Starting backend server with virtual environment..."
nohup $VENV_PYTHON -m uvicorn app:app --reload > nohup.out 2>&1 &

if [ $? -eq 0 ]; then
    echo "Backend server started successfully with virtual environment."
    echo "You can view the server logs in 'nohup.out'"
    echo "Access the API at http://localhost:8000"
else
    echo "Error starting backend server."
    exit 1
fi

echo "Backend restart process completed." 
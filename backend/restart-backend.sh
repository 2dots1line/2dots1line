#!/bin/bash

# Restart script for the 2Dots1Line backend server
# This script will find and kill any processes using port 8000,
# then restart the backend server.

PORT=8000
echo "2Dots1Line Backend Restart Script"
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

# Start the backend server
echo "Starting backend server..."
nohup uvicorn app:app --reload > nohup.out 2>&1 &

if [ $? -eq 0 ]; then
    echo "Backend server started successfully."
    echo "You can view the server logs in 'nohup.out'"
    echo "Access the API at http://localhost:8000"
else
    echo "Error starting backend server."
    exit 1
fi

echo "Backend restart process completed." 
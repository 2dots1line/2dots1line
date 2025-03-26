#!/bin/bash

# Find the PID of the process using port 8000
echo "Looking for processes using port 8000..."
PORT_USERS=$(lsof -i :8000 | grep LISTEN)

if [ -z "$PORT_USERS" ]; then
    echo "No processes found using port 8000."
else
    echo "Found processes using port 8000:"
    echo "$PORT_USERS"
    
    # Extract the PIDs
    PIDS=$(echo "$PORT_USERS" | awk '{print $2}')
    
    # Kill each process
    for PID in $PIDS; do
        echo "Killing process $PID..."
        kill -9 $PID
        
        # Check if the process was killed
        if [ $? -eq 0 ]; then
            echo "Process $PID killed successfully."
        else
            echo "Failed to kill process $PID. You may need sudo permissions."
        fi
    done
fi

# Change to the backend directory
echo "Changing to backend directory..."
cd backend || { echo "Failed to change to backend directory"; exit 1; }

# Start the backend server
echo "Starting backend server..."
uvicorn app:app --reload &

# Wait a few seconds to see if it starts
sleep 3

# Check if the server is running
if nc -z localhost 8000; then
    echo "Backend server started successfully on port 8000."
else
    echo "Backend server failed to start or isn't listening on port 8000."
fi

echo "Done!" 
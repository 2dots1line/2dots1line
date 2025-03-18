#!/bin/bash

# Script to restart the backend server with proper environment setup

# Kill any existing processes on port 8000
echo "Checking for processes on port 8000..."
lsof_result=$(lsof -ti:8000)
if [ -n "$lsof_result" ]; then
    echo "Killing processes: $lsof_result"
    kill -9 $lsof_result || echo "Failed to kill some processes"
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate || { echo "Failed to activate virtual environment. Is it created?"; exit 1; }

# Check if GPU is available
echo "Checking for GPU availability..."
python -c "import torch; print(f'GPU available: {torch.cuda.is_available()}')" || echo "PyTorch not installed or error checking GPU"

# Install or update dependencies if needed
echo "Checking dependencies..."
pip install -r requirements.txt

# Start the server with optimized configuration
echo "Starting backend server with optimized configuration..."
num_workers=$(python -c "import os; print(max(2, min(4, os.cpu_count() or 1)))")
echo "Using $num_workers workers based on available CPU cores"

# Use nohup to run the server in the background
nohup uvicorn app:app --host 0.0.0.0 --port 8000 --workers $num_workers > nohup.out 2>&1 &

echo "Backend server started. Access the API at http://localhost:8000"
echo "Server logs can be viewed in the file: nohup.out" 
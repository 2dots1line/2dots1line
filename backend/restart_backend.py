#!/usr/bin/env python3
"""
Restart script for the 2Dots1Line backend server.
This script will find and kill any processes using port 8000,
then restart the backend server.
"""

import os
import signal
import subprocess
import sys
import time
import platform

def find_process_on_port(port):
    """Find the process ID using the specified port."""
    try:
        if platform.system() == "Windows":
            # Windows approach
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True).decode()
            if output:
                for line in output.split('\n'):
                    if f":{port}" in line and "LISTENING" in line:
                        parts = line.strip().split()
                        return int(parts[-1])
        else:
            # Unix-like approach
            output = subprocess.check_output(f"lsof -i :{port} | grep LISTEN", shell=True).decode()
            if output:
                return int(output.split()[1])
    except subprocess.CalledProcessError:
        # No process found on this port
        pass
    except Exception as e:
        print(f"Error finding process on port {port}: {e}")
    return None

def kill_process(pid):
    """Kill a process by its process ID."""
    try:
        print(f"Killing process with PID {pid}")
        if platform.system() == "Windows":
            subprocess.run(f"taskkill /F /PID {pid}", shell=True)
        else:
            os.kill(pid, signal.SIGKILL)
        # Give the OS a moment to release the port
        time.sleep(1)
        return True
    except Exception as e:
        print(f"Error killing process {pid}: {e}")
        return False

def start_backend():
    """Start the backend server."""
    print("Starting backend server...")
    
    # Check if we're in a virtual environment
    in_venv = sys.prefix != sys.base_prefix
    
    if platform.system() == "Windows":
        cmd = "start cmd /k "
        if in_venv:
            cmd += "uvicorn app:app --reload"
        else:
            cmd += "python -m uvicorn app:app --reload"
        subprocess.Popen(cmd, shell=True, cwd=".")
    else:
        # Unix-like: run in background with nohup
        cmd = []
        if in_venv:
            cmd = ["nohup", "uvicorn", "app:app", "--reload", "&"]
        else:
            cmd = ["nohup", "python", "-m", "uvicorn", "app:app", "--reload", "&"]
        
        with open("nohup.out", "w") as out:
            subprocess.Popen(" ".join(cmd), shell=True, stdout=out, stderr=out, cwd=".")
    
    print("Backend server started.")
    print("You can view the server logs in 'nohup.out'")
    print("Access the API at http://localhost:8000")

def main():
    """Main function to restart the backend server."""
    port = 8000
    
    # Check current directory to make sure we're in the correct place
    if not os.path.exists("app.py"):
        print("Error: app.py not found in current directory.")
        print("Please run this script from the backend directory.")
        return False
    
    print(f"Checking for processes using port {port}...")
    pid = find_process_on_port(port)
    
    if pid:
        print(f"Found process using port {port}: PID {pid}")
        if kill_process(pid):
            print(f"Successfully killed process {pid}")
        else:
            print(f"Warning: Could not kill process {pid}. You may need to kill it manually.")
            if platform.system() == "Windows":
                print(f"Try: taskkill /F /PID {pid}")
            else:
                print(f"Try: kill -9 {pid}")
            return False
    else:
        print(f"No process found using port {port}")
    
    # Start the backend server
    start_backend()
    return True

if __name__ == "__main__":
    print("2Dots1Line Backend Restart Script")
    print("---------------------------------")
    success = main()
    if success:
        print("Backend restart process completed.")
    else:
        print("Backend restart process encountered issues.")
    
    # If we're on Windows, keep the console window open
    if platform.system() == "Windows":
        input("Press Enter to close this window...") 
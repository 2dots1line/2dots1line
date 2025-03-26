#!/usr/bin/env python3
import os
import sys
import subprocess
import time
import signal
import platform

def is_port_in_use(port):
    """Check if a port is in use."""
    if platform.system() == "Windows":
        # Windows command
        netstat_cmd = f"netstat -ano | findstr :{port}"
        try:
            result = subprocess.run(netstat_cmd, shell=True, capture_output=True, text=True)
            return result.stdout.strip() != ""
        except:
            return False
    else:
        # Unix command
        lsof_cmd = f"lsof -i :{port} | grep LISTEN"
        try:
            result = subprocess.run(lsof_cmd, shell=True, capture_output=True, text=True)
            return result.stdout.strip() != ""
        except:
            return False

def kill_process_on_port(port):
    """Kill process using a specific port."""
    print(f"Looking for processes using port {port}...")
    
    if platform.system() == "Windows":
        # Windows: Find process ID using port
        try:
            netstat = subprocess.run(
                f"netstat -ano | findstr :{port}", 
                shell=True, 
                capture_output=True, 
                text=True
            )
            
            if not netstat.stdout:
                print(f"No processes found using port {port}.")
                return
                
            lines = netstat.stdout.strip().split('\n')
            for line in lines:
                if 'LISTENING' in line:
                    pid = line.strip().split()[-1]
                    print(f"Killing process {pid} on port {port}")
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True)
        except Exception as e:
            print(f"Error killing process: {e}")
    else:
        # Unix systems: Find and kill process 
        try:
            lsof = subprocess.run(
                f"lsof -i :{port} | grep LISTEN", 
                shell=True, 
                capture_output=True, 
                text=True
            )
            
            if not lsof.stdout:
                print(f"No processes found using port {port}.")
                return
                
            lines = lsof.stdout.strip().split('\n')
            for line in lines:
                pid = line.split()[1]
                print(f"Killing process {pid} on port {port}")
                try:
                    os.kill(int(pid), signal.SIGKILL)
                    print(f"Process {pid} killed successfully.")
                except Exception as kill_err:
                    print(f"Failed to kill process {pid}: {kill_err}")
        except Exception as e:
            print(f"Error finding process: {e}")

def start_backend():
    """Start the backend server."""
    try:
        # Change to backend directory
        backend_dir = os.path.join(os.getcwd(), "backend")
        if not os.path.exists(backend_dir):
            print("Backend directory not found. Make sure you're in the project root.")
            return False
            
        os.chdir(backend_dir)
        print(f"Changed to directory: {os.getcwd()}")
        
        # Start the server
        print("Starting backend server...")
        
        if platform.system() == "Windows":
            # Windows: Use subprocess.Popen to run in background
            subprocess.Popen(
                ["uvicorn", "app:app", "--reload"], 
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            # Unix: Use nohup to keep process running after script exits
            subprocess.Popen(
                "nohup uvicorn app:app --reload > backend.log 2>&1 &", 
                shell=True, 
                start_new_session=True
            )
            
        # Wait for server to start
        print("Waiting for server to start...")
        time.sleep(5)
        
        # Check if server is running
        if is_port_in_use(8000):
            print("Backend server started successfully on port 8000.")
            return True
        else:
            print("Server failed to start or is not listening on port 8000.")
            return False
            
    except Exception as e:
        print(f"Error starting backend: {e}")
        return False

def main():
    """Main function to restart the backend server."""
    # Kill any process using port 8000
    if is_port_in_use(8000):
        kill_process_on_port(8000)
        # Wait for port to be released
        time.sleep(2)
    
    # Start the backend server
    start_backend()
    
if __name__ == "__main__":
    main() 
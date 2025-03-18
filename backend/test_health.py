#!/usr/bin/env python3
"""
Simple test script for health check.
"""

import requests
import json
import sys

def test_health():
    """Test health endpoint with a very short timeout"""
    print("Testing health endpoint...")
    
    try:
        # Set a very short timeout to avoid hanging
        response = requests.get(
            "http://localhost:8000/health",
            timeout=5  # 5 seconds timeout
        )
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"API Status: {result.get('status')}")
            print(f"MongoDB Status: {result.get('mongodb', {}).get('status')}")
            print(f"Current AI Provider: {result.get('ai_provider', {}).get('current')}")
            print(f"Embedding Model: {result.get('embedding', {}).get('model')}")
            return 0
        else:
            print(f"Error response: {response.text}")
            return 1
    
    except requests.exceptions.Timeout:
        print("Request timed out. The server might be hanging or overloaded.")
        return 1
    except requests.exceptions.ConnectionError:
        print("Connection error. The server might not be running.")
        return 1
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(test_health()) 
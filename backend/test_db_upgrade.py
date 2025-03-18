#!/usr/bin/env python3
"""
Simple test script for database schema upgrade.
"""

import requests
import json
import sys

def test_db_schema_upgrade():
    """Test database schema upgrade API endpoint"""
    print("Testing database schema upgrade endpoint...")
    
    try:
        # Test upgrade endpoint with a short timeout
        print("\nTesting /api/database/upgrade-schema endpoint...")
        response = requests.post(
            "http://localhost:8000/api/database/upgrade-schema",
            timeout=10  # Short timeout to prevent long-running operations
        )
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Status: {result.get('status')}")
            print(f"Timestamp: {result.get('timestamp')}")
            print(f"Indices created: {result.get('indices_created')}")
            print(f"Schemas updated: {result.get('schemas_updated')}")
            print(f"Stories needing embeddings: {result.get('stories_needing_embeddings')}")
            return 0
        else:
            print(f"Error response: {response.text}")
            return 1
    
    except requests.exceptions.Timeout:
        print("Request timed out. The operation might be taking too long.")
        return 1
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(test_db_schema_upgrade()) 
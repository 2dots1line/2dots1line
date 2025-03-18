#!/usr/bin/env python3
"""
Simple test script for vector embedding functionality.
"""

import requests
import json

def test_simple_vector():
    """Test vector embedding API endpoint with a simple story"""
    print("Testing vector embedding API endpoint...")
    
    # Test story
    test_story = {
        "content": "Once upon a time, there was a little girl who loved to read books about space and stars.",
        "child_id": "test_child_id",
        "id": None  # No ID means it won't be saved to the database
    }
    
    try:
        # Test tokenize endpoint
        print("\nTesting /api/stories/tokenize endpoint...")
        response = requests.post(
            "http://localhost:8000/api/stories/tokenize",
            json=test_story,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Status: Success (200)")
            print(f"Tokens count: {len(result.get('tokens', []))}")
            print(f"Vector embedding dimension: {len(result.get('vector_embedding', []))}")
            print(f"First 5 dimensions: {result.get('vector_embedding', [])[:5]}")
            return True
        else:
            print(f"Status: Error ({response.status_code})")
            print(f"Response: {response.text}")
            return False
    
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_simple_vector() 
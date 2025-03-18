#!/usr/bin/env python3
"""
Test script for vectorization and LLM provider switching in 2Dots1Line.
This script tests the backend API endpoints for vectorization and LLM provider switching.
"""

import requests
import json
import time
import argparse
import sys
from pprint import pprint

# Default server URL
DEFAULT_URL = "http://localhost:8000"

class APIClient:
    def __init__(self, base_url=DEFAULT_URL):
        self.base_url = base_url
        self.session = requests.Session()
    
    def get(self, endpoint, params=None):
        """Make a GET request to the API"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.get(url, params=params)
        return self._handle_response(response)
    
    def post(self, endpoint, data=None, json_data=None):
        """Make a POST request to the API"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.post(url, data=data, json=json_data)
        return self._handle_response(response)
    
    def _handle_response(self, response):
        """Handle the API response"""
        try:
            response.raise_for_status()
            if response.content:
                return response.json()
            return {}
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error: {e}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Response text: {response.text}")
            return None
        except Exception as e:
            print(f"Error: {e}")
            return None

def test_health(client):
    """Test the health check endpoint"""
    print("\n=== Testing Health Check ===")
    result = client.get("/health")
    if result:
        print(f"API Status: {result.get('status')}")
        print(f"MongoDB Status: {result.get('mongodb', {}).get('status')}")
        print(f"Current AI Provider: {result.get('ai_provider', {}).get('current')}")
        print(f"Embedding Model: {result.get('embedding', {}).get('model')}")
        return True
    return False

def test_config(client):
    """Test the config endpoint"""
    print("\n=== Testing Configuration ===")
    result = client.get("/config")
    if result:
        print(f"MongoDB Status: {result.get('mongodb_status')}")
        print(f"Current AI Provider: {result.get('ai_provider')}")
        print(f"Available Providers: {list(result.get('providers', {}).keys())}")
        return True
    return False

def test_providers(client):
    """Test the providers endpoint"""
    print("\n=== Testing Available Providers ===")
    result = client.get("/config/providers")
    if result:
        current = result.get('current_provider')
        providers = result.get('providers', {})
        print(f"Current Provider: {current}")
        for provider, details in providers.items():
            status = "✅ ENABLED" if details.get('enabled') else "❌ DISABLED"
            current_marker = "← CURRENT" if details.get('is_current') else ""
            print(f"- {provider}: {status} (Model: {details.get('model')}) {current_marker}")
        return True
    return False

def test_test_ollama(client):
    """Test the Ollama connection"""
    print("\n=== Testing Ollama Connection ===")
    result = client.get("/config/test-ollama")
    if result:
        status = result.get('status')
        print(f"Status: {status}")
        if status == "success":
            print(f"Message: {result.get('message')}")
            print(f"Response Preview: {result.get('response_preview')}")
            print(f"Available Models: {result.get('available_models')}")
            return True
        else:
            print(f"Error: {result.get('message')}")
            if "action_required" in result:
                print(f"Action Required: {result.get('action_required')}")
            return False
    return False

def test_db_schema_upgrade(client):
    """Test the database schema upgrade"""
    print("\n=== Testing Database Schema Upgrade ===")
    result = client.post("/api/database/upgrade-schema")
    if result:
        print(f"Status: {result.get('status')}")
        print(f"Indices Created: {result.get('indices_created')}")
        print(f"Schemas Updated: {result.get('schemas_updated')}")
        print(f"Stories Needing Embeddings: {result.get('stories_needing_embeddings')}")
        return True
    return False

def test_vectorize_all(client, limit=10):
    """Test vectorizing all stories"""
    print(f"\n=== Testing Vectorization of {limit} Stories ===")
    result = client.post(f"/api/stories/vectorize-all?limit={limit}")
    if result:
        print(f"Status: {result.get('status')}")
        print(f"Total Stories Found: {result.get('total_stories_found')}")
        print(f"Successfully Processed: {result.get('successfully_processed')}")
        print(f"Failed Stories: {result.get('failed_stories')}")
        return True
    return False

def test_analyze_story(client):
    """Test analyzing a story"""
    print("\n=== Testing Story Analysis ===")
    
    # Create a test story
    test_story = {
        "content": "Once upon a time, there was a little girl named Lily. She loved to play in the garden with her cat named Whiskers. One day, they found a magical flower that could talk. The flower told them about a hidden treasure under the big oak tree. Lily and Whiskers dug under the tree and found a box of colorful gemstones. They shared the gemstones with all their friends and lived happily ever after.",
        "child_id": "test_child_id"
    }
    
    result = client.post("/api/direct/analyze", json_data=test_story)
    if result:
        print(f"Summary: {result.get('summary')}")
        print(f"Strengths: {result.get('strengths')}")
        print(f"Traits: {result.get('traits')}")
        print(f"AI Insights (preview): {result.get('ai_insights')[:100]}...")
        return True
    return False

def test_switch_provider(client, provider):
    """Test switching AI provider"""
    print(f"\n=== Testing Switching Provider to {provider} ===")
    result = client.post(f"/config/switch-provider/{provider}")
    if result:
        print(f"Status: {result.get('status')}")
        print(f"Provider: {result.get('provider')}")
        if result.get('status') == "success":
            print(f"Test Response Preview: {result.get('test_response_preview')}")
            return True
        else:
            print(f"Error: {result.get('error')}")
            return False
    return False

def run_all_tests(client, args):
    """Run all tests"""
    results = {}
    
    # Basic endpoint tests
    results["health"] = test_health(client)
    results["config"] = test_config(client)
    results["providers"] = test_providers(client)
    
    # Database tests
    if args.db:
        results["db_schema_upgrade"] = test_db_schema_upgrade(client)
    
    # Ollama test (only if specified)
    if args.ollama:
        results["test_ollama"] = test_test_ollama(client)
    
    # Vectorization test (only if specified)
    if args.vectorize:
        results["vectorize_all"] = test_vectorize_all(client, args.limit)
    
    # Story analysis test (only if specified)
    if args.analyze:
        results["analyze_story"] = test_analyze_story(client)
    
    # Provider switching tests (if specified)
    if args.switch:
        # Test switching to OpenRouter
        results["switch_to_openrouter"] = test_switch_provider(client, "openrouter")
        
        # Test story analysis with OpenRouter
        if args.analyze and results["switch_to_openrouter"]:
            results["analyze_story_openrouter"] = test_analyze_story(client)
        
        # Test switching to Ollama (only if test_ollama succeeded)
        if args.ollama and results.get("test_ollama", False):
            results["switch_to_ollama"] = test_switch_provider(client, "ollama")
            
            # Test story analysis with Ollama
            if args.analyze and results["switch_to_ollama"]:
                results["analyze_story_ollama"] = test_analyze_story(client)
        
        # Switch back to original provider
        results["switch_to_original"] = test_switch_provider(client, "openrouter")
    
    # Print summary
    print("\n=== Test Results Summary ===")
    for test, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test}: {status}")
    
    # Return overall success
    return all(results.values())

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Test 2Dots1Line vectorization and LLM provider switching")
    parser.add_argument("--url", default=DEFAULT_URL, help=f"Backend API URL (default: {DEFAULT_URL})")
    parser.add_argument("--db", action="store_true", help="Run database schema upgrade test")
    parser.add_argument("--ollama", action="store_true", help="Run Ollama connection test")
    parser.add_argument("--vectorize", action="store_true", help="Run vectorization test")
    parser.add_argument("--analyze", action="store_true", help="Run story analysis test")
    parser.add_argument("--switch", action="store_true", help="Run provider switching test")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    parser.add_argument("--limit", type=int, default=10, help="Limit for vectorization test (default: 10)")
    return parser.parse_args()

def main():
    """Main function"""
    args = parse_args()
    
    # If --all is specified, enable all tests
    if args.all:
        args.db = True
        args.ollama = True
        args.vectorize = True
        args.analyze = True
        args.switch = True
    
    # If no tests are specified, print help and exit
    if not (args.db or args.ollama or args.vectorize or args.analyze or args.switch):
        print("No tests specified. Use --all to run all tests or specify individual tests.")
        print("Use --help for more information.")
        return 1
    
    print(f"Testing 2Dots1Line backend API at {args.url}")
    print(f"Running tests: {'db ' if args.db else ''}{'ollama ' if args.ollama else ''}{'vectorize ' if args.vectorize else ''}{'analyze ' if args.analyze else ''}{'switch ' if args.switch else ''}")
    
    # Create API client
    client = APIClient(args.url)
    
    # Run all tests
    success = run_all_tests(client, args)
    
    # Return exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 
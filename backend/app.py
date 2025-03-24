from fastapi import FastAPI, HTTPException, Body, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal, AsyncIterator
from enum import Enum
import pymongo
import os
import sys
from dotenv import load_dotenv
import json
from bson import ObjectId
import requests
from datetime import datetime
import asyncio
import time
import numpy as np
import torch
from sentence_transformers import SentenceTransformer
import nltk
from nltk.tokenize import word_tokenize
from nltk.tag import pos_tag

# Optimize NLTK data downloads with proper path handling
nltk_data_path = os.path.expanduser("~/.nltk_data")
nltk.data.path.append(nltk_data_path)

if not os.path.exists(nltk_data_path):
    os.makedirs(nltk_data_path, exist_ok=True)

try:
    nltk.data.find('tokenizers/punkt', paths=[nltk_data_path])
except LookupError:
    print("⏳ Downloading NLTK punkt tokenizer...")
    nltk.download('punkt', download_dir=nltk_data_path)
    print("✅ NLTK punkt tokenizer downloaded successfully")

try:
    nltk.data.find('taggers/averaged_perceptron_tagger', paths=[nltk_data_path])
except LookupError:
    print("⏳ Downloading NLTK averaged_perceptron_tagger...")
    nltk.download('averaged_perceptron_tagger', download_dir=nltk_data_path)
    print("✅ NLTK averaged_perceptron_tagger downloaded successfully")

# Load environment variables - improve error handling
print("🚀 Starting 2Dots1Line AI Service...")
print(f"📂 Current working directory: {os.getcwd()}")

# First try to load from backend/.env
load_dotenv()

# AI Provider definition with Enum
class AIProvider(str, Enum):
    OPENROUTER = "openrouter"
    OLLAMA = "ollama"
    CLOUD = "cloud"  # Added for future cloud-based providers

# Provider configuration model
class ProviderConfig(BaseModel):
    name: str
    enabled: bool
    endpoint: str
    model: str
    api_key: Optional[str] = None
    headers: Dict[str, str] = {}
    timeout: int = 30
    
    class Config:
        arbitrary_types_allowed = True

# AI Provider Registry
class AIProviderRegistry:
    def __init__(self):
        self.providers = {}
        self.current_provider = None
        self.active_requests = {}
        
    def register_provider(self, provider_name: str, config: ProviderConfig):
        self.providers[provider_name] = config
        print(f"Registered AI provider: {provider_name} with model {config.model}")
        
    def get_provider(self, provider_name: str) -> Optional[ProviderConfig]:
        return self.providers.get(provider_name)
    
    def get_current_provider(self) -> Optional[ProviderConfig]:
        if self.current_provider:
            return self.providers.get(self.current_provider)
        return None
        
    def set_current_provider(self, provider_name: str) -> bool:
        if provider_name in self.providers and self.providers[provider_name].enabled:
            self.current_provider = provider_name
            print(f"Set current AI provider to: {provider_name}")
            return True
        return False
    
    def list_providers(self):
        return {name: {
            "enabled": config.enabled, 
            "model": config.model,
            "is_current": name == self.current_provider
        } for name, config in self.providers.items()}
        
    def track_request(self, request_id, info):
        """Track a new AI request"""
        self.active_requests[request_id] = {
            "status": "started",
            "start_time": time.time(),
            "info": info,
            "provider": self.current_provider
        }
        
    def update_request_status(self, request_id, status, **kwargs):
        """Update status of an AI request"""
        if request_id in self.active_requests:
            self.active_requests[request_id]["status"] = status
            for key, value in kwargs.items():
                self.active_requests[request_id][key] = value
                
    def get_active_requests(self):
        """Get all active requests with elapsed time"""
        current_time = time.time()
        result = {}
        # Clean up completed requests older than 10 minutes
        to_remove = []
        for req_id, req_info in self.active_requests.items():
            elapsed = current_time - req_info["start_time"]
            if req_info["status"] in ["completed", "failed"] and elapsed > 600:  # 10 minutes
                to_remove.append(req_id)
            else:
                result[req_id] = {**req_info, "elapsed_seconds": round(elapsed, 2)}
        
        # Remove old completed requests
        for req_id in to_remove:
            del self.active_requests[req_id]
            
        return result

# Initialize the provider registry
ai_provider_registry = AIProviderRegistry()

# Check if required environment variables are loaded
MONGODB_URI = os.getenv("MONGODB_URI")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not MONGODB_URI:
    print("⚠️ Warning: MONGODB_URI not found in .env file")
    # As a fallback, try to load from parent directory's .env.local
    parent_env_path = os.path.join(os.path.dirname(os.getcwd()), '.env.local')
    if os.path.exists(parent_env_path):
        print(f"🔍 Trying to load variables from {parent_env_path}")
        from dotenv import dotenv_values
        parent_env = dotenv_values(parent_env_path)
        MONGODB_URI = parent_env.get("MONGODB_URI")
        # If JWT_SECRET exists in parent env, use it as OPENROUTER_API_KEY
        if parent_env.get("JWT_SECRET") and not OPENROUTER_API_KEY:
            OPENROUTER_API_KEY = parent_env.get("JWT_SECRET")
            print("🔑 Using JWT_SECRET as OPENROUTER_API_KEY")

# Optimize AI provider selection logic
AI_PROVIDER = os.getenv("AI_PROVIDER", "openrouter").lower()

if AI_PROVIDER == "openrouter":
    OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")
    print(f"✅ Using OpenRouter with model: {OPENROUTER_MODEL}")
    
elif AI_PROVIDER == "ollama":
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
    print(f"✅ Using Ollama locally with model: {OLLAMA_MODEL}")
    
elif AI_PROVIDER == "cloud":
    CLOUD_AI_ENDPOINT = os.getenv("CLOUD_AI_ENDPOINT")
    CLOUD_AI_KEY = os.getenv("CLOUD_AI_KEY")
    print(f"✅ Using Cloud-based AI at {CLOUD_AI_ENDPOINT}")
    
else:
    print(f"⚠️ Warning: Unknown AI_PROVIDER '{AI_PROVIDER}', falling back to OpenRouter")
    AI_PROVIDER = "openrouter"

# Get embedding model name
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
print(f"🔍 Using Embedding Model: {EMBEDDING_MODEL}")

# Initialize sentence transformer model with GPU if available
sentence_transformer = None
try:
    print(f"⏳ Loading Sentence Transformer model: {EMBEDDING_MODEL}")
    # Check if GPU is available and use it
    device = "cuda" if torch.cuda.is_available() else "cpu"
    sentence_transformer = SentenceTransformer(EMBEDDING_MODEL, device=device)
    print(f"✅ Sentence Transformer model loaded successfully on {device}")
except Exception as e:
    print(f"❌ Error loading Sentence Transformer model: {e}")
    sentence_transformer = None

# Final check for required variables
if not MONGODB_URI:
    raise ValueError("❌ MONGODB_URI environment variable is not set. Please check your .env file.")

# Initialize Ollama configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
print(f"🔧 Ollama URL: {OLLAMA_URL}, Model: {OLLAMA_MODEL}")

# OpenRouter configuration
OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")
print(f"🔧 Using OpenRouter model: {OPENROUTER_MODEL}")
SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")
SITE_NAME = os.getenv("SITE_NAME", "2Dots1Line")

# Configure OpenRouter provider
openrouter_headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": SITE_URL,
    "X-Title": SITE_NAME
}

openrouter_config = ProviderConfig(
    name="OpenRouter",
    enabled=bool(OPENROUTER_API_KEY),
    endpoint=OPENROUTER_API_ENDPOINT,
    model=OPENROUTER_MODEL,
    api_key=OPENROUTER_API_KEY,
    headers=openrouter_headers
)
ai_provider_registry.register_provider(AIProvider.OPENROUTER, openrouter_config)

# Configure Ollama provider
ollama_config = ProviderConfig(
    name="Ollama",
    enabled=True,  # We'll test the connection later
    endpoint=f"{OLLAMA_URL}/api/chat",
    model=OLLAMA_MODEL,
    headers={"Content-Type": "application/json"},
    timeout=120  # Increase timeout for large models like qwq:32B
)
ai_provider_registry.register_provider(AIProvider.OLLAMA, ollama_config)

# Set current provider from environment
ai_provider_registry.set_current_provider(AI_PROVIDER)

print(f"MONGODB_URI found: {MONGODB_URI[:20]}...")
print(f"OPENROUTER_API_KEY {'found' if OPENROUTER_API_KEY else 'not found'}")

# Initialize FastAPI app
app = FastAPI(title="2Dots1Line AI Service",
              description="API for story analysis and AI-powered insights")

# Configure CORS to allow requests from the frontend
# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001")
allowed_origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",")]

# Add * for development if CORS_ALLOW_ALL is set to true
if os.getenv("CORS_ALLOW_ALL", "false").lower() == "true":
    allowed_origins.append("*")
    print("Warning: CORS allows all origins (*). This should not be used in production.")
else:
    print(f"CORS configured with specific origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "User-Agent", "DNT", "Cache-Control", "X-Mx-ReqToken", "X-Requested-With"]
)

# MongoDB connection
mongodb_connected = False
db = None
client = None

def validate_mongo_connection():
    """Validate MongoDB connection and retry if necessary"""
    global client, db, mongodb_connected

    if mongodb_connected and client is not None and db is not None:
        try:
            # Try a lightweight operation to check connection
            client.admin.command('ping')
            return True
        except Exception as e:
            print(f"MongoDB connection validation failed: {e}")
            mongodb_connected = False

    # Initial connection or reconnection
    max_retries = 3
    retry_delay = 2  # seconds

    for attempt in range(max_retries):
        try:
            print(f"Connecting to MongoDB (attempt {attempt+1}/{max_retries})...")
            client = pymongo.MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=5000,          # 5 second connection timeout
                socketTimeoutMS=30000           # 30 second socket timeout
            )
            
    # Verify connection
    client.admin.command('ping')
    print("Connected to MongoDB successfully")
            
            # Initialize database
    db = client["2dots1line"]
            
            # Verify collections
            required_collections = ["stories", "children", "users", "households"]
            existing_collections = db.list_collection_names()
            
            for collection in required_collections:
                if collection not in existing_collections:
                    print(f"Warning: Collection '{collection}' not found in database")
            
            # Check if we have data in the stories collection
            stories_count = db.stories.count_documents({})
            print(f"Found {stories_count} stories in the database")
            
    mongodb_connected = True
            return True
            
        except pymongo.errors.ServerSelectionTimeoutError as e:
            print(f"MongoDB server selection timeout (attempt {attempt+1}): {e}")
        except pymongo.errors.ConnectionFailure as e:
            print(f"MongoDB connection failure (attempt {attempt+1}): {e}")
except Exception as e:
            print(f"MongoDB connection error (attempt {attempt+1}): {e}")
        
        if attempt < max_retries - 1:
            print(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
            retry_delay *= 2  # Exponential backoff
    
    # All connection attempts failed
    print("All MongoDB connection attempts failed. Some features will be unavailable.")
    mongodb_connected = False
    client = None
    db = None
    return False

# Run initial MongoDB connection
validate_mongo_connection()

# Helper class for JSON serialization of ObjectId
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Models
class Story(BaseModel):
    id: Optional[str] = None
    content: str
    child_id: str
    
    class Config:
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",  # Example valid MongoDB ObjectId
                "content": "Once upon a time in a magical forest...",
                "child_id": "507f1f77bcf86cd799439022"  # Example valid MongoDB ObjectId
            }
        }
        
    def get_child_id_as_object_id(self):
        """Safely convert child_id to ObjectId or return None if not possible"""
        try:
            return ObjectId(self.child_id)
        except Exception:
            return None
            
    def get_id_as_object_id(self):
        """Safely convert id to ObjectId or return None if not possible"""
        if not self.id:
            return None
        try:
            return ObjectId(self.id)
        except Exception:
            return None

class StoryAnalysis(BaseModel):
    strengths: List[str]
    traits: List[str]
    summary: str
    ai_insights: str
    related_story_ids: Optional[List[str]] = None

class TokenizedStory(BaseModel):
    tokens: List[Dict[str, Any]]
    vector_embedding: List[float]

# Set request timeout
REQUEST_TIMEOUT = 10  # seconds

# Routes
@app.get("/")
async def root():
    return {"message": "2Dots1Line AI Service is running", "mongodb_status": "connected" if mongodb_connected else "disconnected"}

@app.get("/health")
async def health_check():
    try:
        # Add timeout for health check response
        start_time = time.time()
        
        # Check MongoDB connection
        mongodb_status = "disconnected"
        mongodb_error = None
        
        if mongodb_connected:
            try:
                # Use our validation function
                if validate_mongo_connection():
                mongodb_status = "connected"
                    
                    # Get collection counts for additional info
                    collection_stats = {}
                    if db is not None:
                        for collection_name in ["stories", "children", "users", "households"]:
                            try:
                                collection = db[collection_name]
                                count = collection.count_documents({})
                                collection_stats[collection_name] = count
                            except Exception as coll_err:
                                collection_stats[collection_name] = f"error: {str(coll_err)[:30]}..."
                else:
                    mongodb_status = "validation_failed"
            except Exception as e:
                print(f"Health check MongoDB error: {e}")
                mongodb_status = "error"
                mongodb_error = str(e)[:100]
        
        # Check current AI provider
        ai_provider = ai_provider_registry.current_provider
        provider_config = ai_provider_registry.get_current_provider()
        
        # Log request time
        elapsed = time.time() - start_time
        print(f"Health check completed in {elapsed:.2f} seconds")
        
        return {
            "status": "healthy", 
            "timestamp": datetime.now().isoformat(),
            "uptime_seconds": time.time() - start_time,
            "mongodb": {
                "status": mongodb_status,
                "error": mongodb_error,
                "collections": collection_stats if mongodb_status == "connected" else None
            },
            "ai_provider": {
                "current": ai_provider,
                "model": provider_config.model if provider_config else None,
                "all_providers": ai_provider_registry.list_providers()
            },
            "embedding": {
                "model": EMBEDDING_MODEL,
                "loaded": bool(sentence_transformer)
            },
            "response_time": f"{elapsed:.2f}s"
        }
    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "message": str(e)
        }

@app.post("/api/stories/analyze", response_model=StoryAnalysis)
async def analyze_story(story: Story, request_id: Optional[str] = None):
    start_time = time.time()
    if not request_id:
        request_id = f"story_{int(time.time())}"
        
    print(f"Received analysis request for story: {story.id}, content length: {len(story.content)}, child_id: {story.child_id}")
    
    try:
        # Get the child information if MongoDB is connected
        child_data = None
        previous_stories = []
        
        if mongodb_connected and db is not None:
            try:
                child_collection = db.children
                # Find the child in the database
                child_id_obj = story.get_child_id_as_object_id()
                if child_id_obj:
                    print(f"Looking up child with ObjectId: {child_id_obj}")
                    # Try all possible collections that might contain children
                    collections_to_check = ['children', 'users']
                    
                    for collection_name in collections_to_check:
                        print(f"Checking collection: {collection_name}")
                        try:
                            collection = db[collection_name]
                            found_child = collection.find_one({"_id": child_id_obj})
                            if found_child:
                                print(f"Child found in {collection_name} collection")
                                child_data = found_child
                                break
                        except Exception as coll_err:
                            print(f"Error checking {collection_name} collection: {coll_err}")
                else:
                    print(f"Looking up child with string ID: {story.child_id}")
                    # Try with string ID across collections
                    collections_to_check = ['children', 'users']
                    
                    for collection_name in collections_to_check:
                        print(f"Checking collection: {collection_name}")
                        try:
                            collection = db[collection_name]
                            found_child = collection.find_one({"_id": story.child_id})
                            if found_child:
                                print(f"Child found in {collection_name} collection with string ID")
                                child_data = found_child
                                break
                        except Exception as coll_err:
                            print(f"Error checking {collection_name} collection: {coll_err}")
                
                if not child_data:
                    print(f"Child not found with ID: {story.child_id}")
                    # Create a fallback child data object
                    child_data = {"name": "the child", "dateOfBirth": None}  # Fallback data
                
                # Get previous stories by the same child (limit to 5)
                story_id_obj = None
                if story.id:
                    try:
                        story_id_obj = ObjectId(story.id)
                    except Exception as id_err:
                        print(f"Warning: story.id is not a valid ObjectId: {story.id}. Error: {id_err}")
                
                # Try to get previous stories with more flexible query
                print(f"Looking for previous stories for child: {story.child_id}")
                stories_collection = db.stories
                
                try:
                    # Try with ObjectId
                    if child_id_obj:
                        previous_stories_cursor = stories_collection.find({
                            "$or": [
                                {"child": child_id_obj},
                                {"child_id": child_id_obj},
                                {"childId": child_id_obj},
                            ]
                        }).sort("createdAt", -1).limit(5)
                        
                        previous_stories = list(previous_stories_cursor)
                        print(f"Found {len(previous_stories)} previous stories for child by ObjectId")
                    
                    # If no stories found, try with string ID
                    if not previous_stories:
                        print(f"Trying to find stories with string child ID: {story.child_id}")
                        previous_stories_cursor = stories_collection.find({
                            "$or": [
                                {"child": story.child_id},
                                {"child_id": story.child_id}, 
                                {"childId": story.child_id},
                            ]
                        }).sort("createdAt", -1).limit(5)
                        
                        previous_stories = list(previous_stories_cursor)
                        print(f"Found {len(previous_stories)} previous stories for child by string ID")
                    
                    # Filter out the current story if it exists
                    if story_id_obj:
                        previous_stories = [s for s in previous_stories if s.get("_id") != story_id_obj]
                    
                except Exception as stories_err:
                    print(f"Error retrieving previous stories: {stories_err}")
                    previous_stories = []
            except Exception as mongo_err:
                print(f"Error accessing MongoDB: {mongo_err}")
                child_data = {"name": "the child", "dateOfBirth": None}  # Fallback data
        else:
            print("MongoDB not connected, using default child data")
            child_data = {"name": "the child", "dateOfBirth": None}  # Fallback data
        
        # Generate embeddings for the story if it has an ID
        if story.id and mongodb_connected and db is not None:
            asyncio.create_task(generate_or_update_embedding(story.id, story.content))
        
        # Extract child's name and age
        child_name = child_data.get("name", "the child")
        
        # Get previous story snippets
        previous_story_texts = []
        for prev_story in previous_stories:
            content = prev_story.get("content", "")
            if content:
                # Limit to first 100 characters to avoid prompt getting too large
                previous_story_texts.append(content[:100] + "...")

        # If the child has previous stories with embeddings, find related ones
        similar_stories = []
        if story.id and mongodb_connected and db is not None:
            try:
                # This will make a quick check for similar stories
                similar_stories_data = await find_similar_stories(story.id)
                for s in similar_stories_data:
                    similar_stories.append(s.get("content", "")[:100] + "...")
            except Exception as sim_err:
                print(f"Error finding similar stories: {sim_err}")
        
        # Prepare context for the AI based on previous and similar stories
        prev_stories_context = ""
        if previous_story_texts:
            prev_stories_context = f"Previous stories by this child:\n" + "\n".join([f"- {text}" for text in previous_story_texts[:3]])
        
        sim_stories_context = ""
        if similar_stories:
            sim_stories_context = f"Similar stories by this child:\n" + "\n".join([f"- {text}" for text in similar_stories[:3]])
        
        # Prepare the prompt for the AI
        user_message = f"""
As a child development expert, analyze this story written by {child_name}:

STORY:
{story.content}

{prev_stories_context}

{sim_stories_context}

Provide a thoughtful analysis in the following format:
1. SUMMARY: A brief, 2-3 sentence summary of the story.
2. STRENGTHS: List 3-5 strengths or skills demonstrated in the writing (creative thinking, vocabulary use, etc.) - one per line with a dash.
3. TRAITS: List 3-5 personality traits or interests revealed by the story's themes and content - one per line with a dash.
4. INSIGHTS: 2-3 paragraphs of developmental insights about the child based on this story.

IMPORTANT: Use plain text format only. Do not use asterisks, markdown symbols, or other special formatting. Number sections as shown above.
Maintain a positive, encouraging tone while providing substantive feedback.
"""

        # Format messages for the LLM
        messages = [
            {"role": "system", "content": "You are a child development expert who analyzes children's writing to provide insights about their skills, interests, and development."},
            {"role": "user", "content": user_message}
        ]
        
        # Call the selected LLM provider
        try:
            print("Calling LLM provider...")
            ai_response = await call_llm_provider(messages, request_id=request_id)
            print(f"Received LLM response of length: {len(ai_response)}")
        except Exception as ai_err:
            print(f"Error calling LLM: {ai_err}")
            # Provide a fallback response
            ai_response = "I couldn't analyze this story at the moment. Please try again later."
        
        # Parse the AI response (in a more resilient way)
        strengths = []
        traits = []
        summary = ""
        ai_insights = ""
        
        # Clean the response of any unwanted characters
        ai_response = ai_response.replace("**", "").replace("---", "").replace("##", "")
        
        # Simple parsing based on keywords
        if "SUMMARY:" in ai_response or "1. SUMMARY:" in ai_response or "1.SUMMARY:" in ai_response:
            # Try different summary patterns
            summary_patterns = ["SUMMARY:", "1. SUMMARY:", "1.SUMMARY:"]
            for pattern in summary_patterns:
                if pattern in ai_response:
                    parts = ai_response.split(pattern, 1)[1]
                    # Find the end of summary section
                    end_markers = ["STRENGTHS:", "2. STRENGTHS:", "2.STRENGTHS:"]
                    for marker in end_markers:
                        if marker in parts:
                            summary = parts.split(marker)[0].strip()
                            break
                    if summary:
                        break
        
        if "STRENGTHS:" in ai_response or "2. STRENGTHS:" in ai_response or "2.STRENGTHS:" in ai_response:
            # Get strengths section
            strengths_patterns = ["STRENGTHS:", "2. STRENGTHS:", "2.STRENGTHS:"]
            for pattern in strengths_patterns:
                if pattern in ai_response:
                    parts = ai_response.split(pattern, 1)[1]
                    # Find the end of strengths section
                    end_markers = ["TRAITS:", "3. TRAITS:", "3.TRAITS:"]
                    strengths_text = ""
                    for marker in end_markers:
                        if marker in parts:
                            strengths_text = parts.split(marker)[0].strip()
                            break
                    if strengths_text:
                        # Extract bullet points or numbered items
                        lines = strengths_text.split('\n')
                        for line in lines:
                            line = line.strip()
                            # Remove bullet points, numbers, and other markers
                            if line and (line.startswith("-") or line.startswith("•") or 
                                        any(line.startswith(f"{i}.") for i in range(1, 10))):
                                # Clean the line
                                clean_line = line
                                for prefix in ["-", "•", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9."]:
                                    if clean_line.startswith(prefix):
                                        clean_line = clean_line[len(prefix):].strip()
                                if clean_line:
                                    strengths.append(clean_line)
                        break
        
        # If no strengths found with bullets, try to split by line or comma
        if not strengths:
            if "STRENGTHS:" in ai_response:
                strengths_part = ai_response.split("STRENGTHS:")[1]
                if "TRAITS:" in strengths_part:
                    strengths_part = strengths_part.split("TRAITS:")[0]
                
                # Try splitting by line first
                lines = [line.strip() for line in strengths_part.split('\n') if line.strip()]
                if len(lines) >= 2:
                    for line in lines:
                        # Remove any leading markers or numbers
                        clean_line = line
                        for prefix in ["-", "•", "1.", "2.", "3.", "4.", "5."]:
                            if clean_line.startswith(prefix):
                                clean_line = clean_line[len(prefix):].strip()
                        if clean_line and not clean_line.startswith("TRAITS") and len(clean_line) > 3:
                            strengths.append(clean_line)
                # If still no strengths, try comma separation
                elif len(lines) == 1 and "," in lines[0]:
                    strengths = [s.strip() for s in lines[0].split(",") if s.strip()]
        
        # Process traits section
        if "TRAITS:" in ai_response or "3. TRAITS:" in ai_response or "3.TRAITS:" in ai_response:
            # Get traits section
            traits_patterns = ["TRAITS:", "3. TRAITS:", "3.TRAITS:"]
            for pattern in traits_patterns:
                if pattern in ai_response:
                    parts = ai_response.split(pattern, 1)[1]
                    # Find the end of traits section
                    end_markers = ["INSIGHTS:", "4. INSIGHTS:", "4.INSIGHTS:"]
                    traits_text = ""
                    for marker in end_markers:
                        if marker in parts:
                            traits_text = parts.split(marker)[0].strip()
                                    break
                    if traits_text:
                        # Extract bullet points or numbered items
                        lines = traits_text.split('\n')
                        for line in lines:
                            line = line.strip()
                            # Remove bullet points, numbers, and other markers
                            if line and (line.startswith("-") or line.startswith("•") or 
                                        any(line.startswith(f"{i}.") for i in range(1, 10))):
                                # Clean the line
                                clean_line = line
                                for prefix in ["-", "•", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9."]:
                                    if clean_line.startswith(prefix):
                                        clean_line = clean_line[len(prefix):].strip()
                                if clean_line:
                                    traits.append(clean_line)
                        break
        
        # If no traits found with bullets, try to split by line or comma
        if not traits:
            if "TRAITS:" in ai_response:
                traits_part = ai_response.split("TRAITS:")[1]
                if "INSIGHTS:" in traits_part:
                    traits_part = traits_part.split("INSIGHTS:")[0]
                
                # Try splitting by line first
                lines = [line.strip() for line in traits_part.split('\n') if line.strip()]
                if len(lines) >= 2:
                    for line in lines:
                        # Remove any leading markers or numbers
                        clean_line = line
                        for prefix in ["-", "•", "1.", "2.", "3.", "4.", "5."]:
                            if clean_line.startswith(prefix):
                                clean_line = clean_line[len(prefix):].strip()
                        if clean_line and not clean_line.startswith("INSIGHTS") and len(clean_line) > 3:
                            traits.append(clean_line)
                # If still no traits, try comma separation
                elif len(lines) == 1 and "," in lines[0]:
                    traits = [s.strip() for s in lines[0].split(",") if s.strip()]
        
        # Get insights
        if "INSIGHTS:" in ai_response or "4. INSIGHTS:" in ai_response or "4.INSIGHTS:" in ai_response:
            # Try different patterns
            insights_patterns = ["INSIGHTS:", "4. INSIGHTS:", "4.INSIGHTS:"]
            for pattern in insights_patterns:
                if pattern in ai_response:
                    ai_insights = ai_response.split(pattern, 1)[1].strip()
                    break
        
        # Strip any special markdown characters from final outputs
        if summary:
            summary = summary.replace("*", "").replace("#", "").replace("_", "").strip()
        if ai_insights:
            ai_insights = ai_insights.replace("*", "").replace("#", "").replace("_", "").strip()
        
        # Make sure strengths and traits have at least some items
        if not strengths:
            summary_words = summary.split()
            # Extract some keywords from the summary as strengths
            if len(summary_words) > 10:
                strengths = ["Written expression", "Storytelling ability", "Narrative skills"]
            else:
                strengths = ["Basic story structure", "Sequential thinking"]
        
        if not traits:
            # Extract some default traits based on the strengths
            if "creative" in summary.lower() or "imagination" in summary.lower():
                traits.append("Creative")
            if "confident" in summary.lower() or "achievement" in summary.lower():
                traits.append("Confident")
            if len(traits) < 2:
                traits.append("Expressive")
                traits.append("Thoughtful")
        
        # If we have a single trait with comma-separated values, split it
        if len(traits) == 1 and "," in traits[0]:
            traits = [t.strip() for t in traits[0].split(",") if t.strip()]
            
        # If we have a single strength with comma-separated values, split it
        if len(strengths) == 1 and "," in strengths[0]:
            strengths = [s.strip() for s in strengths[0].split(",") if s.strip()]
            
        # If no insights were found, use the entire response
        if not summary and not strengths and not traits and not ai_insights:
            summary = "This story shows the child's imagination and writing skills."
            ai_insights = ai_response.replace("*", "").replace("#", "").replace("_", "").strip()
            strengths = ["Written expression", "Storytelling"]
            traits = ["Creative", "Imaginative"]
        
        # Store the story analysis in the database if connected
                if mongodb_connected and db is not None and story.id:
                    try:
                        stories_collection = db.stories
                        
                # Save vector embedding and analysis
                stories_collection.update_one(
                    {"_id": ObjectId(story.id)},
                            {"$set": {
                        "analysis": {
                            "summary": summary,
                            "strengths": strengths,
                            "traits": traits,
                            "insights": ai_insights,
                            "analyzed_at": datetime.now(),
                            "analyzerModel": AI_PROVIDER,
                            "modelName": OPENROUTER_MODEL if AI_PROVIDER == "openrouter" else OLLAMA_MODEL
                        }
                    }}
                )
                print(f"Saved analysis to database for story: {story.id}")
            except Exception as mongo_err:
                print(f"Error saving analysis to MongoDB: {mongo_err}")
        
        # Log timing
        elapsed = time.time() - start_time
        print(f"Analysis completed in {elapsed:.2f} seconds")
        
        # Return the analysis
        return {
            "summary": summary,
            "strengths": strengths,
            "traits": traits,
            "ai_insights": ai_insights,
            "related_story_ids": [str(s.get("_id", "")) for s in previous_stories[:3]]
        }
    
    except Exception as e:
        print(f"Error in analyze_story: {e}")
        return {
            "summary": "Error analyzing story.",
            "strengths": ["Unable to analyze"],
            "traits": ["Unable to analyze"],
            "ai_insights": f"Sorry, we encountered an error analyzing this story. Please try again later.",
            "related_story_ids": []
        }

@app.post("/api/stories/tokenize", response_model=TokenizedStory)
async def tokenize_story(story: Story):
    try:
        print(f"Tokenizing story: {story.id}, content length: {len(story.content)}")
        
        # 1. POS Tagging using NLTK
        words = word_tokenize(story.content)
        tagged_words = pos_tag(words)
        tokens = [{"token": word, "pos": tag} for word, tag in tagged_words]
        
        # 2. Generate embeddings using Sentence Transformers
        if sentence_transformer:
            # Generate embedding for the full story
            vector_embedding = sentence_transformer.encode(story.content)
            vector_embedding = vector_embedding.tolist()  # Convert numpy array to list for JSON serialization
            print(f"Generated embedding of dimension: {len(vector_embedding)}")
        else:
            # Fallback to placeholder if model failed to load
            print("Warning: Using placeholder embeddings as sentence transformer model is not available")
            vector_embedding = [0.1] * 384  # Common dimension for embedding models
        
        # 3. Store in MongoDB if connected and story.id exists
        if mongodb_connected and db is not None and story.id:
            try:
                stories_collection = db["stories"]
                # Update the story with the new embeddings and tokens
                result = stories_collection.update_one(
                    {"_id": ObjectId(story.id)},
                    {"$set": {
                        "vectorEmbedding": vector_embedding, 
                        "tokens": tokens,
                        "embeddingModel": EMBEDDING_MODEL,
                        "embeddingUpdatedAt": datetime.now()
                    }}
                )
                print(f"Updated story in MongoDB: {result.modified_count} document(s) modified")
            except Exception as mongo_error:
                print(f"Error saving tokenization to MongoDB: {mongo_error}")
        
        return {
            "tokens": tokens,
            "vector_embedding": vector_embedding
        }
        
    except Exception as e:
        print(f"Error in tokenize_story: {e}")
        # Return a minimal response in case of error
        return {
            "tokens": [{"token": "error", "pos": "NOUN"}],
            "vector_embedding": [0.0] * 384  # Use standard dimension
        }

@app.get("/api/stories/similar/{story_id}", response_model=List[Dict[str, Any]])
async def find_similar_stories(story_id: str, limit: int = 5):
    """Find similar stories based on vector similarity"""
    return await find_similar_stories_optimized(story_id, limit)

@app.get("/test-openrouter")
async def test_openrouter():
    """Test connection to OpenRouter API"""
    if not OPENROUTER_API_KEY:
        return {"status": "error", "message": "API key not configured"}
    
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": SITE_URL,
            "X-Title": SITE_NAME
        }
        
        # Use a simple test message
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, this is a test message"
                }
            ]
        }
        
        print(f"Testing OpenRouter API with key prefix: {OPENROUTER_API_KEY[:10]}...")
        response = requests.post(OPENROUTER_API_ENDPOINT, headers=headers, json=payload)
        print(f"OpenRouter response status: {response.status_code}")
        
        return {
            "status": "success" if response.status_code == 200 else "error",
            "status_code": response.status_code,
            "mongodb_status": "connected" if mongodb_connected else "disconnected",
            "response": response.json() if response.status_code == 200 else response.text,
            "api_key_prefix": OPENROUTER_API_KEY[:10] + "..." if OPENROUTER_API_KEY else None
        }
    except Exception as e:
        print(f"Error testing OpenRouter API: {str(e)}")
        return {"status": "error", "message": str(e), "mongodb_status": "connected" if mongodb_connected else "disconnected"}

@app.post("/api/direct/analyze")
async def direct_analyze(request_data: dict):
    start_time = time.time()
    request_id = f"story_{int(time.time())}"
    print(f"Received direct analysis request: {request_data}")
    
    try:
        # Validate required fields
        if not request_data.get("content"):
            print("Missing required field: content")
            raise HTTPException(status_code=400, detail="Missing required field: content")
        if not request_data.get("child_id"):
            print("Missing required field: child_id")
            raise HTTPException(status_code=400, detail="Missing required field: child_id")
            
        # Create a Story object to pass to analyze_story
        story_id = request_data.get("id")
        content = request_data.get("content")
        child_id = request_data.get("child_id")
        
        # Log the data being sent
        print(f"Creating Story object with id={story_id}, content={content[:30]}..., child_id={child_id}")
        
        # Create the Story object
        story = Story(
            id=story_id,
            content=content,
            child_id=child_id
        )
        
        # Use the helper methods to check if IDs are valid ObjectIds
        child_id_obj = story.get_child_id_as_object_id()
        if not child_id_obj and mongodb_connected:
            print(f"Warning: child_id '{child_id}' is not a valid MongoDB ObjectId. Lookup in database may fail.")
        
        if story.id:
            story_id_obj = story.get_id_as_object_id()
            if not story_id_obj and mongodb_connected:
                print(f"Warning: story id '{story.id}' is not a valid MongoDB ObjectId. Database update may fail.")
        
        # Call the analyze_story function with request_id
        print("Calling analyze_story function...")
        analysis = await analyze_story(story, request_id)
        
        elapsed_time = time.time() - start_time
        print(f"Direct analysis completed in {elapsed_time:.2f}s")
        return analysis
        
    except HTTPException as http_err:
        # Re-raise HTTP exceptions
        print(f"HTTP exception in direct_analyze: {http_err.detail}")
        raise http_err
    except Exception as e:
        print(f"Error in direct_analyze: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/test/ask")
async def test_ask_question(request_data: dict):
    print(f"Test endpoint received question: {request_data.get('question')}")
    
    if not request_data.get("question"):
        raise HTTPException(status_code=400, detail="No question provided")
    
    # Get the current provider
    current_provider = ai_provider_registry.current_provider
    provider_config = ai_provider_registry.get_current_provider()
    
    if not provider_config:
        raise HTTPException(status_code=500, detail="No AI provider configured")
    
    if not provider_config.enabled:
        raise HTTPException(status_code=500, detail=f"Provider {current_provider} is disabled")
    
    try:
        print(f"Sending test question to {current_provider}...")
        start_time = time.time()
        
        # Use the appropriate provider for the test
        messages = [
            {"role": "system", "content": "You are a helpful assistant. Provide clear, concise answers in plain text format. Do not use LaTeX, markdown, or other formatting. For example, answer '206' instead of '\\boxed{206}'."},
            {"role": "user", "content": request_data.get("question")}
        ]
        
        # Call the selected provider
        try:
            if current_provider == AIProvider.OPENROUTER:
                answer = await call_openrouter(messages)
            elif current_provider == AIProvider.OLLAMA:
                answer = await call_ollama(messages)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported provider: {current_provider}")
        except Exception as provider_err:
            print(f"Error calling {current_provider}: {provider_err}")
            raise HTTPException(status_code=500, detail=f"Error calling {current_provider}: {str(provider_err)}")
        
        elapsed_time = time.time() - start_time
        print(f"{current_provider} response received in {elapsed_time:.2f} seconds")
        print(f"Received answer: {answer[:50]}...")
        
        return {
            "answer": answer,
            "elapsed_time_seconds": elapsed_time,
            "provider": current_provider,
            "model": provider_config.model
        }
            
    except Exception as e:
        error_message = str(e)
        print(f"Error in test endpoint: {error_message}")
        raise HTTPException(status_code=500, detail=f"Test request failed: {error_message}")

@app.get("/config")
async def get_config():
    """Get the current configuration of the API"""
    current_provider = ai_provider_registry.get_current_provider()
    return {
        "mongodb_status": "connected" if mongodb_connected else "disconnected",
        "ai_provider": ai_provider_registry.current_provider,
        "providers": ai_provider_registry.list_providers(),
        "embedding": {
            "model": EMBEDDING_MODEL,
            "loaded": bool(sentence_transformer)
        }
    }

@app.get("/config/providers")
async def list_providers():
    """Get a list of available AI providers and their status"""
    return {
        "current_provider": ai_provider_registry.current_provider,
        "providers": ai_provider_registry.list_providers()
    }

@app.post("/config/switch-provider/{provider}")
async def switch_provider(provider: AIProvider):
    """Switch the AI provider"""
    # Check if the provider exists and is enabled
    provider_config = ai_provider_registry.get_provider(provider)
    if not provider_config:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")
    
    if not provider_config.enabled:
        raise HTTPException(status_code=400, detail=f"Provider {provider} is disabled")
    
    # Test the provider before switching
    test_messages = [
        {"role": "user", "content": "Hello, this is a test message to verify the provider works."}
    ]
    
    try:
        # Test the provider based on its type
        if provider == AIProvider.OPENROUTER:
            response = await call_openrouter(test_messages)
        elif provider == AIProvider.OLLAMA:
            response = await call_ollama(test_messages)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
        
        # If we got here, the test was successful, so switch the provider
        ai_provider_registry.set_current_provider(provider)
        
        # Update the .env file with the new setting
        try:
            env_path = os.path.join(os.getcwd(), '.env')
            if os.path.exists(env_path):
                with open(env_path, 'r') as file:
                    lines = file.readlines()
                
                with open(env_path, 'w') as file:
                    for line in lines:
                        if line.startswith('AI_PROVIDER='):
                            file.write(f'AI_PROVIDER={provider}\n')
                        else:
                            file.write(line)
                print(f"Updated .env file with new AI_PROVIDER={provider}")
        except Exception as env_err:
            print(f"Error updating .env file: {env_err}")
        
        return {
            "status": "success",
            "provider": provider,
            "test_response_preview": response[:100] if response else None
        }
    except Exception as e:
        return {
            "status": "error",
            "provider": ai_provider_registry.current_provider,  # Return the unchanged provider
            "error": str(e)
        }

@app.get("/config/test-ollama")
async def test_ollama():
    """Test connection to Ollama API"""
    provider_config = ai_provider_registry.get_provider(AIProvider.OLLAMA)
    
    if not provider_config:
        return {
            "status": "error",
            "message": "Ollama provider not configured"
        }
    
    try:
        # First test if Ollama server is running
        ping_url = f"{OLLAMA_URL}/api/tags"
        try:
            print(f"Testing Ollama API connection at {ping_url}")
            response = requests.get(ping_url, timeout=5)
            if response.status_code != 200:
                # Update provider status to disabled
                provider_config.enabled = False
                return {
                    "status": "error",
                    "message": f"Ollama server returned status code {response.status_code}",
                    "raw_response": response.text
                }
        except Exception as conn_err:
            # Update provider status to disabled
            provider_config.enabled = False
            return {
                "status": "error",
                "message": f"Could not connect to Ollama server at {OLLAMA_URL}: {str(conn_err)}"
            }
        
        # Test the specified model
        chat_url = provider_config.endpoint
        payload = {
            "model": provider_config.model,
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, this is a test message"
                }
            ],
            "stream": False
        }
        
        print(f"Testing Ollama API with model: {provider_config.model}")
        response = requests.post(
            chat_url, 
            headers=provider_config.headers, 
            json=payload,
            timeout=60  # Increased timeout for large models like qwq:32B
        )
        
        if response.status_code == 200:
            result = response.json()
            available_models = []
            
            # Also get available models
            try:
                models_response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
                if models_response.status_code == 200:
                    models_data = models_response.json()
                    if "models" in models_data:
                        available_models = [model["name"] for model in models_data["models"]]
            except Exception as models_err:
                print(f"Error fetching available models: {models_err}")
            
            # Update provider status to enabled
            provider_config.enabled = True
            
            return {
                "status": "success",
                "message": "Ollama server is working properly",
                "response_preview": result["message"]["content"][:100] if "message" in result else None,
                "available_models": available_models,
                "provider_status": "enabled"
            }
        else:
            # Check if it's a specific model issue
            if "model not found" in response.text.lower():
                return {
                    "status": "error",
                    "message": f"Model '{provider_config.model}' not found in Ollama",
                    "raw_response": response.text,
                    "available_models": await get_ollama_models(),
                    "action_required": "Please pull the model with: ollama pull " + provider_config.model
                }
            
            # Update provider status to disabled
            provider_config.enabled = False
            
            return {
                "status": "error",
                "message": f"Ollama server returned status code {response.status_code}",
                "raw_response": response.text
            }
    except Exception as e:
        # Update provider status to disabled
        provider_config.enabled = False
        
        return {
            "status": "error",
            "message": str(e)
        }

async def get_ollama_models():
    """Helper function to get available Ollama models"""
    try:
        models_response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if models_response.status_code == 200:
            models_data = models_response.json()
            if "models" in models_data:
                return [model["name"] for model in models_data["models"]]
    except Exception:
        pass
    return []

@app.post("/api/stories/vectorize-all")
async def vectorize_all_stories(limit: int = 100, batch_size: int = 10):
    """Batch process all stories to generate or update vector embeddings with optimized batching"""
    if not mongodb_connected or db is None:
        raise HTTPException(status_code=503, detail="MongoDB not connected")
    
    if not sentence_transformer:
        raise HTTPException(status_code=503, detail="Sentence transformer model not loaded")
    
    try:
        # Get stories without vector embeddings or with outdated embeddings
        stories_collection = db.stories
        
        # Find stories without embeddings
        stories_without_embeddings = list(stories_collection.find(
            {"$or": [
                {"vectorEmbedding": {"$exists": False}},
                {"vectorEmbedding": None},
                {"embeddingModel": {"$ne": EMBEDDING_MODEL}}
            ]}
        ).limit(limit))
        
        print(f"Found {len(stories_without_embeddings)} stories without proper embeddings")
        
        # Process them in batches for better efficiency
        successfully_processed = 0
        failed_stories = []
        
        # Process in batches to improve efficiency
        for i in range(0, len(stories_without_embeddings), batch_size):
            batch = stories_without_embeddings[i:i+batch_size]
            texts = []
            story_ids = []
            story_objects = []
            
            # Prepare batch data
            for story in batch:
                content = story.get("content", "")
                if not content:
                    print(f"Story {str(story['_id'])} has no content, skipping")
                    failed_stories.append({"id": str(story['_id']), "reason": "No content"})
                    continue
                    
                texts.append(content)
                story_ids.append(str(story['_id']))
                story_objects.append(story)
            
            if not texts:
                continue
            
            # Generate embeddings for the entire batch at once
            try:
                print(f"Generating embeddings for batch of {len(texts)} stories...")
                start_time = time.time()
                
                # Use GPU if available for faster processing
                batch_embeddings = sentence_transformer.encode(texts)
                
                elapsed = time.time() - start_time
                print(f"Batch embedding generation completed in {elapsed:.2f}s ({len(texts)/elapsed:.2f} stories/sec)")
                
                # Update each story with its embedding
                for idx, (story_id, story) in enumerate(zip(story_ids, story_objects)):
                    try:
                        vector_embedding = batch_embeddings[idx].tolist()
                        
                        # Update the story
                        update_result = stories_collection.update_one(
                            {"_id": story["_id"]},
                            {"$set": {
                                "vectorEmbedding": vector_embedding,
                                "embeddingModel": EMBEDDING_MODEL,
                                "embeddingUpdatedAt": datetime.now()
                            }}
                        )
                        
                        if update_result.modified_count > 0:
                            successfully_processed += 1
                        else:
                            print(f"Failed to update story {story_id} in database")
                            failed_stories.append({"id": story_id, "reason": "Database update failed"})
    except Exception as e:
                        print(f"Error updating story {story_id}: {e}")
                        failed_stories.append({"id": story_id, "reason": str(e)})
                
            except Exception as batch_err:
                print(f"Error processing batch: {batch_err}")
                for story_id in story_ids:
                    failed_stories.append({"id": story_id, "reason": f"Batch error: {str(batch_err)}"})
        
    return {
            "status": "success",
            "total_stories_found": len(stories_without_embeddings),
            "successfully_processed": successfully_processed,
            "failed_stories": failed_stories,
            "embedding_model": EMBEDDING_MODEL,
            "device": "cuda" if torch.cuda.is_available() else "cpu"
        }
        
    except Exception as e:
        print(f"Error in vectorize_all_stories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/database/upgrade-schema")
async def upgrade_database_schema():
    """
    Upgrade the database schema to ensure it has all the required fields for vectorization
    """
    if not mongodb_connected or db is None:
        raise HTTPException(status_code=503, detail="MongoDB not connected")
    
    try:
        # 1. Create indices for faster queries
        indices_created = []
        
        # Stories collection indices
        try:
            stories_collection = db.stories
            # Index on child field for faster retrieval of child's stories
            stories_collection.create_index("child")
            # Index on embedding model for finding stories with outdated embeddings
            stories_collection.create_index("embeddingModel")
            # Compound index on child and createdAt for sorting by recency
            stories_collection.create_index([("child", 1), ("createdAt", -1)])
            
            indices_created.append("stories collection indices")
        except Exception as e:
            print(f"Error creating stories indices: {e}")
        
        # 2. Verify and update schema if needed
        schemas_updated = []
        
        # Add required fields to stories collection using updateMany if missing
        try:
            result = stories_collection.update_many(
                {"embeddingModel": {"$exists": False}},
                {"$set": {"embeddingModel": None, "embeddingUpdatedAt": None}}
            )
            schemas_updated.append(f"Added embedding fields to {result.modified_count} stories")
        except Exception as e:
            print(f"Error updating stories schema: {e}")
        
        # 3. Add vectorEmbedding field to stories that don't have it
        # This won't actually populate the field with embeddings, just add it as null
        try:
            result = stories_collection.update_many(
                {"vectorEmbedding": {"$exists": False}},
                {"$set": {"vectorEmbedding": None}}
            )
            schemas_updated.append(f"Added vectorEmbedding field to {result.modified_count} stories")
        except Exception as e:
            print(f"Error adding vectorEmbedding field: {e}")
        
        # 4. Add analysis fields for proper schema
        try:
            result = stories_collection.update_many(
                {"analysis": {"$exists": False}},
                {"$set": {"analysis": {
                    "summary": None,
                    "strengths": [],
                    "traits": [],
                    "insights": None,
                    "analyzed_at": None,
                    "analyzerModel": None
                }}}
            )
            schemas_updated.append(f"Added analysis fields to {result.modified_count} stories")
        except Exception as e:
            print(f"Error adding analysis fields: {e}")
        
        # 5. Count documents that need embeddings
        try:
            needs_embeddings_count = stories_collection.count_documents({
                "$or": [
                    {"vectorEmbedding": None},
                    {"vectorEmbedding": {"$exists": False}},
                    {"embeddingModel": {"$ne": EMBEDDING_MODEL}}
                ]
            })
            schemas_updated.append(f"Found {needs_embeddings_count} stories needing embeddings")
        except Exception as e:
            print(f"Error counting stories needing embeddings: {e}")
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "indices_created": indices_created,
            "schemas_updated": schemas_updated,
            "stories_needing_embeddings": needs_embeddings_count if 'needs_embeddings_count' in locals() else "unknown"
        }
    except Exception as e:
        print(f"Error in upgrade_database_schema: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Add optimized function to generate embeddings for new stories
async def generate_or_update_embedding(story_id, content=None, batch_mode=False):
    """
    Generate or update the vector embedding for a story with improved performance
    """
    if not mongodb_connected or db is None:
        print("MongoDB not connected. Cannot update embeddings.")
        return False
        
    try:
        # Get story content if not provided
        stories_collection = db["stories"]
        story = None
        
        if not content:
            story = stories_collection.find_one({"_id": ObjectId(story_id)})
            if not story:
                print(f"Story not found with ID: {story_id}")
                return False
            content = story.get("content", "")
            
        if not content:
            print(f"Story has no content: {story_id}")
            return False
            
        # Generate embedding with optimized processing
        if sentence_transformer:
            start_time = time.time()
            
            # Use GPU acceleration if available
            vector_embedding = sentence_transformer.encode(content).tolist()
            
            elapsed = time.time() - start_time
            print(f"Generated embedding for story {story_id} in {elapsed:.4f}s")
            
            # Update the story with the new embedding
            update_result = stories_collection.update_one(
                {"_id": ObjectId(story_id)},
                {"$set": {
                    "vectorEmbedding": vector_embedding,
                    "embeddingModel": EMBEDDING_MODEL,
                    "embeddingUpdatedAt": datetime.now()
                }}
            )
            
            if update_result.modified_count > 0 or update_result.matched_count > 0:
                print(f"Updated embedding for story: {story_id}")
                return True
            else:
                print(f"Failed to update embedding for story: {story_id}")
                return False
        else:
            print("Sentence transformer not available, cannot generate embedding")
            return False
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return False

# Add a function to create MongoDB indexes for optimization
@app.post("/api/database/optimize-indexes")
async def optimize_database_indexes():
    """Create indexes to optimize query performance in MongoDB"""
    if not mongodb_connected or db is None:
        raise HTTPException(status_code=503, detail="MongoDB not connected")
    
    try:
        # Get the stories collection
        stories_collection = db.stories
        
        # Create indexes
        indexes_created = []
        
        # Index on child field
        stories_collection.create_index([("child", 1)])
        indexes_created.append("child")
        
        # Index on embedding model for faster filtering
        stories_collection.create_index([("embeddingModel", 1)])
        indexes_created.append("embeddingModel")
        
        # Compound index for sorting by child and creation date
        stories_collection.create_index([("child", 1), ("createdAt", -1)])
        indexes_created.append("child_createdAt")
        
        # Create full text search index on content
        stories_collection.create_index([("content", "text")])
        indexes_created.append("content_text")
        
        # Add index for analysis fields if they exist
        try:
            stories_collection.create_index([("analysis.analyzed_at", -1)])
            indexes_created.append("analysis.analyzed_at")
        except Exception as analysis_err:
            print(f"Error creating analysis index: {analysis_err}")
        
        return {
            "status": "success",
            "indexes_created": indexes_created,
            "message": "Database indexes optimized successfully"
        }
    except Exception as e:
        print(f"Error optimizing database indexes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
def calculate_age(child):
    """Calculate child's age from birthdate"""
    if not child or not child.get("dateOfBirth"):
        return "unknown age"
    
    try:
        dob_str = child.get("dateOfBirth")
        # Parse the birthdate from ISO format or MongoDB ISODate
        if isinstance(dob_str, str):
            from datetime import datetime
            dob = datetime.fromisoformat(dob_str.replace('Z', '+00:00'))
        else:
            dob = dob_str
            
        from datetime import datetime
        now = datetime.now()
        age_years = now.year - dob.year - ((now.month, now.day) < (dob.month, dob.day))
        age_months = now.month - dob.month
        if age_months < 0:
            age_months += 12
            
        if age_years > 0:
            age_str = f"{age_years} year"
            if age_years != 1:
                age_str += "s"
            return age_str
        else:
            age_str = f"{age_months} month"
            if age_months != 1:
                age_str += "s"
            return age_str
    except Exception as e:
        print(f"Error calculating age: {str(e)}")
        return "unknown age"

def extract_section(text, section_name):
    """Extract a section from text based on common section patterns"""
    import re
    
    # Try different patterns to find sections
    patterns = [
        # Header pattern (e.g., ## Strengths)
        rf"#{{1,3}}\s*{section_name}:?\s*(.*?)(?=#|\Z)",
        # Numbered section (e.g., 1. Strengths)
        rf"\d+\.\s*{section_name}:?\s*(.*?)(?=\d+\.|\Z)",
        # Section with colon (e.g., Strengths: xyz)
        rf"{section_name}:\s*(.*?)(?=[A-Z][a-z]+:|\Z)",
        # Uppercase section (e.g., STRENGTHS)
        rf"{section_name.upper()}:?\s*(.*?)(?=[A-Z][A-Z]+:?|\Z)"
    ]
    
    for pattern in patterns:
        matches = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if matches:
            return matches.group(1).strip()
    
    # Try looking for the section name anywhere in the text
    pos = text.lower().find(section_name.lower())
    if pos >= 0:
        # Extract content after the section name until the next section or end
        section_text = text[pos + len(section_name):]
        # Look for the next potential section heading
        next_section = re.search(r'([A-Z][a-z]+:|[A-Z][A-Z]+:?|\d+\.|\#)', section_text)
        if next_section:
            return section_text[:next_section.start()].strip()
        else:
            return section_text.strip()
    
    return ""

def extract_list_items(text):
    """Extract bullet or numbered list items from text"""
    import re
    
    # Try to find numbered or bullet list items
    items = []
    
    # Look for bullet points
    bullet_matches = re.findall(r'[-•*]\s*(.*?)(?=[-•*]|\Z)', text, re.MULTILINE)
    items.extend([item.strip() for item in bullet_matches if item.strip()])
    
    # Look for numbered items
    numbered_matches = re.findall(r'\d+\.\s*(.*?)(?=\d+\.|\Z)', text, re.MULTILINE)
    items.extend([item.strip() for item in numbered_matches if item.strip()])
    
    # If no structured list found, try to split by commas or newlines
    if not items:
        if ',' in text:
            items = [item.strip() for item in text.split(',') if item.strip()]
        else:
            items = [item.strip() for item in text.split('\n') if item.strip()]
    
    # Limit to reasonable length items and remove any weird characters
    clean_items = []
    for item in items:
        # Remove any leading numbers or symbols
        clean_item = re.sub(r'^[\d\.\-\*•]+\s*', '', item)
        # Remove any trailing punctuation
        clean_item = re.sub(r'[,.;:]+$', '', clean_item)
        # Only add if it's not too long and not empty
        if clean_item and len(clean_item) < 100:
            clean_items.append(clean_item)
    
    # If still no items found, just return a default
    if not clean_items:
        parts = text.split()
        if parts:
            # Try to extract phrases of 1-3 words
            for i in range(0, len(parts), 3):
                if i + 3 <= len(parts):
                    clean_items.append(' '.join(parts[i:i+3]))
                elif i < len(parts):
                    clean_items.append(' '.join(parts[i:]))
                
                # Stop after getting a few items
                if len(clean_items) >= 5:
                    break
    
    return clean_items[:5]  # Limit to 5 items

# Add a function to call different LLM providers
async def call_llm_provider(messages, max_retries=3, request_id=None):
    """
    Call the configured LLM provider based on environment settings
    """
    current_provider = ai_provider_registry.get_current_provider()
    
    if not current_provider:
        raise ValueError("No AI provider configured or current provider not set")
    
    provider_name = ai_provider_registry.current_provider
    print(f"Using AI provider: {provider_name}")
    
    # Generate a request ID if not provided
    if not request_id:
        request_id = f"req_{int(time.time())}_{provider_name}"
    
    # Track this request
    ai_provider_registry.track_request(request_id, {
        "message_length": sum(len(m.get("content", "")) for m in messages),
        "model": current_provider.model
    })
    
    for attempt in range(max_retries):
        try:
            ai_provider_registry.update_request_status(request_id, "in_progress", attempt=attempt+1)
            
            if provider_name == AIProvider.OPENROUTER:
                result = await call_openrouter(messages)
            elif provider_name == AIProvider.OLLAMA:
                result = await call_ollama(messages)
            else:
                # Fallback to OpenRouter if provider is unknown
                print(f"Unknown AI provider: {provider_name}, falling back to OpenRouter")
                ai_provider_registry.update_request_status(request_id, "fallback", fallback_to="openrouter")
                if ai_provider_registry.set_current_provider(AIProvider.OPENROUTER):
                    result = await call_openrouter(messages)
                else:
                    raise ValueError(f"Fallback to OpenRouter failed - provider not configured")
            
            # Update request status to completed
            ai_provider_registry.update_request_status(request_id, "completed", 
                                                     response_length=len(result) if result else 0)
            return result
            
        except Exception as e:
            print(f"Error calling {provider_name} (attempt {attempt+1}/{max_retries}): {e}")
            ai_provider_registry.update_request_status(request_id, "error", error=str(e))
            
            if attempt == max_retries - 1:
                # On last attempt, try fallback provider
                if provider_name != AIProvider.OPENROUTER and ai_provider_registry.get_provider(AIProvider.OPENROUTER).enabled:
                    print(f"Falling back to OpenRouter after {max_retries} failed attempts with {provider_name}")
                    ai_provider_registry.update_request_status(request_id, "fallback", fallback_to="openrouter")
                    try:
                        result = await call_openrouter(messages)
                        ai_provider_registry.update_request_status(request_id, "completed", 
                                                                 response_length=len(result) if result else 0)
                        return result
                    except Exception as fallback_err:
                        print(f"Fallback to OpenRouter also failed: {fallback_err}")
                        ai_provider_registry.update_request_status(request_id, "failed", 
                                                                 error=f"Both providers failed: {e}, fallback: {fallback_err}")
                
                # Mark as failed if all attempts failed
                ai_provider_registry.update_request_status(request_id, "failed", error=str(e))
                raise  # Re-raise the last exception if fallback also failed
            await asyncio.sleep(1)  # Wait before retrying

async def call_openrouter(messages):
    """Call OpenRouter API"""
    provider_config = ai_provider_registry.get_provider(AIProvider.OPENROUTER)
    
    if not provider_config or not provider_config.enabled:
        raise ValueError("OpenRouter provider not configured or disabled")
    
    if not provider_config.api_key:
        raise ValueError("OpenRouter API key not configured")
    
    payload = {
        "model": provider_config.model,
        "messages": messages
    }
    
    print(f"Calling OpenRouter API with model: {provider_config.model}")
    response = requests.post(
        provider_config.endpoint, 
        headers=provider_config.headers,
        json=payload,
        timeout=provider_config.timeout
    )
    response.raise_for_status()  # Raise exception for HTTP errors
    
    result = response.json()
    if "choices" not in result or not result["choices"]:
        raise ValueError(f"Invalid response from OpenRouter: {result}")
    
    return result["choices"][0]["message"]["content"]

async def call_ollama(messages):
    """Call Ollama API"""
    provider_config = ai_provider_registry.get_provider(AIProvider.OLLAMA)
    
    if not provider_config or not provider_config.enabled:
        raise ValueError("Ollama provider not configured or disabled")
    
    # Format messages for Ollama
    payload = {
        "model": provider_config.model,
        "messages": messages,
        "stream": False
    }
    
    print(f"Calling Ollama API at {provider_config.endpoint} with model: {provider_config.model}")
    
    response = requests.post(
        provider_config.endpoint,
        headers=provider_config.headers,
        json=payload,
        timeout=provider_config.timeout
    )
    response.raise_for_status()  # Raise exception for HTTP errors
    
    result = response.json()
    if "message" not in result:
        raise ValueError(f"Invalid response from Ollama: {result}")
    
    return result["message"]["content"]

# Add a new endpoint to monitor AI generation status
@app.get("/api/status/ai-requests")
async def get_ai_requests_status():
    """Get status of active and recent AI requests"""
    active_requests = ai_provider_registry.get_active_requests()
    return {
        "current_provider": ai_provider_registry.current_provider,
        "requests": active_requests
    }

# Add a /test-ai endpoint for backward compatibility
@app.post("/test-ai")
async def test_ai(request_data: dict):
    """Test endpoint for AI providers - redirects to /api/test/ask for backward compatibility"""
    if "question" not in request_data:
        # Try to convert query to question if provided
        if "query" in request_data:
            request_data["question"] = request_data["query"]
        else:
            raise HTTPException(status_code=400, detail="No question or query provided")
    
    # Forward to the existing test endpoint
    return await test_ask_question(request_data)

# Add streaming API support
async def stream_ai_response(prompt: str):
    """Stream AI responses for better user experience"""
    request_id = f"stream_{int(time.time())}"
    current_provider = ai_provider_registry.current_provider
    provider_config = ai_provider_registry.get_current_provider()
    
    if not provider_config:
        yield json.dumps({"error": "No AI provider configured"})
        return
    
    messages = [
        {"role": "user", "content": prompt}
    ]
    
    ai_provider_registry.track_request(request_id, {
        "message_length": len(prompt),
        "model": provider_config.model,
        "streaming": True
    })
    
    try:
        ai_provider_registry.update_request_status(request_id, "in_progress")
        
        if current_provider == AIProvider.OPENROUTER:
            # OpenRouter streaming
            headers = provider_config.headers.copy()
            
            payload = {
                "model": provider_config.model,
                "messages": messages,
                "stream": True
            }
            
            async with requests.post(
                provider_config.endpoint,
                headers=headers,
                json=payload,
                stream=True,
                timeout=provider_config.timeout
            ) as response:
                response.raise_for_status()
                async for line in response.iter_lines():
                    if line:
                        # Process SSE format
                        if line.startswith(b'data: '):
                            data = line[6:].decode('utf-8')
                            if data.strip() == '[DONE]':
                                break
                            try:
                                chunk = json.loads(data)
                                if 'choices' in chunk and chunk['choices']:
                                    content = chunk['choices'][0].get('delta', {}).get('content', '')
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                pass
        
        elif current_provider == AIProvider.OLLAMA:
            # Ollama streaming
            payload = {
                "model": provider_config.model,
                "messages": messages,
                "stream": True
            }
            
            async with requests.post(
                provider_config.endpoint,
                headers=provider_config.headers,
                json=payload,
                stream=True,
                timeout=provider_config.timeout
            ) as response:
                response.raise_for_status()
                async for line in response.iter_lines():
                    if line:
                        try:
                            chunk = json.loads(line.decode('utf-8'))
                            content = chunk.get('message', {}).get('content', '')
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            pass
                            
        ai_provider_registry.update_request_status(request_id, "completed")
        
    except Exception as e:
        error_msg = str(e)
        print(f"Error in streaming: {error_msg}")
        ai_provider_registry.update_request_status(request_id, "failed", error=error_msg)
        yield json.dumps({"error": error_msg})

@app.post("/api/ai/stream")
async def ai_stream_endpoint(data: dict = Body(...)):
    """Endpoint for streaming AI responses"""
    if "prompt" not in data:
        raise HTTPException(status_code=400, detail="Missing 'prompt' field in request")
    
    return StreamingResponse(
        stream_ai_response(data["prompt"]),
        media_type="text/event-stream"
    )

# Optimize vector search using MongoDB $vectorSearch
async def find_similar_stories_optimized(story_id: str, top_k: int = 5):
    """Find similar stories using vector search with MongoDB Atlas"""
    if not mongodb_connected or db is None:
        print("MongoDB not connected. Cannot find similar stories.")
        return []
        
    try:
        stories_collection = db["stories"]
        
        # Get the story
        story = stories_collection.find_one({"_id": ObjectId(story_id)})
        if not story:
            print(f"Story not found with ID: {story_id}")
            return []
        
        # Get the vector embedding
        vector_embedding = story.get("vectorEmbedding")
        if not vector_embedding:
            print(f"Story has no vector embedding: {story_id}")
            return []
            
        # Get the child ID
        child_id = story.get("child")
        if not child_id:
            print(f"Story has no child ID: {story_id}")
            return []
            
        # Try to use $vectorSearch if available (MongoDB Atlas)
        try:
            # Check if we can use $vectorSearch - it requires MongoDB Atlas
            # This will fall back to manual calculation if not available
            results = stories_collection.aggregate([
                {
                    "$search": {
                        "vectorSearch": {
                            "queryVector": vector_embedding,
                            "path": "vectorEmbedding",
                            "numCandidates": top_k * 2,
                            "limit": top_k * 2
                        }
                    }
                },
                {
                    "$match": {
                        "child": child_id,
                        "_id": {"$ne": ObjectId(story_id)}
                    }
                },
                {
                    "$limit": top_k
                },
                {
                    "$project": {
                        "_id": 1,
                        "content": 1,
                        "createdAt": 1,
                        "score": {"$meta": "searchScore"}
                    }
                }
            ])
            
            similar_stories = list(results)
            
            if similar_stories:
                print(f"Found {len(similar_stories)} similar stories using vector search")
                return [
                    {
                        "id": str(s["_id"]),
                        "content": s.get("content", "")[:100] + "...",
                        "similarity_score": s.get("score", 0),
                        "created_at": s.get("createdAt")
                    }
                    for s in similar_stories
                ]
            
        except Exception as vector_err:
            print(f"Vector search error (falling back to manual calculation): {vector_err}")
        
        # Fallback to manual similarity calculation
        print("Using manual similarity calculation")
        child_stories = list(stories_collection.find(
            {"child": child_id, "_id": {"$ne": ObjectId(story_id)}, "vectorEmbedding": {"$exists": True}}
        ))
        
        if not child_stories:
            print(f"No other stories found for child: {child_id}")
            return []
        
        # Calculate cosine similarity for each story
        similarity_scores = []
        for s in child_stories:
            s_embedding = s.get("vectorEmbedding")
            if s_embedding and len(s_embedding) == len(vector_embedding):
                # Calculate cosine similarity
                dot_product = sum(a * b for a, b in zip(vector_embedding, s_embedding))
                magnitude_a = sum(a ** 2 for a in vector_embedding) ** 0.5
                magnitude_b = sum(b ** 2 for b in s_embedding) ** 0.5
                
                if magnitude_a > 0 and magnitude_b > 0:
                    similarity = dot_product / (magnitude_a * magnitude_b)
                else:
                    similarity = 0
                
                similarity_scores.append((s, similarity))
        
        # Sort by similarity score
        similarity_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Take the top k most similar stories
        result = []
        for s, score in similarity_scores[:top_k]:
            result.append({
                "id": str(s["_id"]),
                "content": s.get("content", "")[:100] + "...",
                "similarity_score": round(score, 4),
                "created_at": s.get("createdAt")
            })
        
        return result
    
    except Exception as e:
        print(f"Error in find_similar_stories_optimized: {e}")
        return []

# Run the server with: uvicorn app:app --reload
if __name__ == "__main__":
    import uvicorn
    # Run with workers for better performance
    uvicorn.run("app:app", host="0.0.0.0", port=8000, workers=4)
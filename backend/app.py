from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
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

# Load environment variables - improve error handling
print("Starting 2Dots1Line AI Service...")
print(f"Current working directory: {os.getcwd()}")

# First try to load from backend/.env
load_dotenv()

# Check if required environment variables are loaded
MONGODB_URI = os.getenv("MONGODB_URI")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not MONGODB_URI:
    print("Warning: MONGODB_URI not found in .env file")
    # As a fallback, try to load from parent directory's .env.local
    parent_env_path = os.path.join(os.path.dirname(os.getcwd()), '.env.local')
    if os.path.exists(parent_env_path):
        print(f"Trying to load variables from {parent_env_path}")
        from dotenv import dotenv_values
        parent_env = dotenv_values(parent_env_path)
        MONGODB_URI = parent_env.get("MONGODB_URI")
        # If JWT_SECRET exists in parent env, use it as OPENROUTER_API_KEY
        if parent_env.get("JWT_SECRET") and not OPENROUTER_API_KEY:
            OPENROUTER_API_KEY = parent_env.get("JWT_SECRET")
            print("Using JWT_SECRET as OPENROUTER_API_KEY")

# Final check for required variables
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is not set. Please check your .env file.")

# OpenRouter configuration
OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")
print(f"Using OpenRouter model: {OPENROUTER_MODEL}")
SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")
SITE_NAME = os.getenv("SITE_NAME", "2Dots1Line")

print(f"MONGODB_URI found: {MONGODB_URI[:20]}...")
print(f"OPENROUTER_API_KEY {'found' if OPENROUTER_API_KEY else 'not found'}")

# Initialize FastAPI app
app = FastAPI(title="2Dots1Line AI Service",
              description="API for story analysis and AI-powered insights")

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],  # More permissive for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
try:
    client = pymongo.MongoClient(MONGODB_URI)
    # Verify connection
    client.admin.command('ping')
    print("Connected to MongoDB successfully")
    db = client["2dots1line"]
    mongodb_connected = True
except Exception as e:
    print(f"MongoDB connection error: {e}")
    print("Starting server without MongoDB connection. Some features will be unavailable.")
    mongodb_connected = False
    # Create a fallback client and db objects
    client = None
    db = None

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
        if mongodb_connected and client:
            try:
                client.admin.command('ping')
                mongodb_status = "connected"
            except Exception as e:
                print(f"Health check MongoDB error: {e}")
                mongodb_status = f"error: {str(e)[:100]}..."
        
        # Check if OpenRouter API key is configured
        ai_status = "configured" if OPENROUTER_API_KEY else "not configured"
        
        # Log request time
        elapsed = time.time() - start_time
        print(f"Health check completed in {elapsed:.2f} seconds")
        
        return {
            "status": "healthy", 
            "mongodb": mongodb_status,
            "ai_api": ai_status,
            "response_time": f"{elapsed:.2f}s"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/api/stories/analyze", response_model=StoryAnalysis)
async def analyze_story(story: Story):
    start_time = time.time()
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
                                {"author": child_id_obj}
                            ]
                        })
                        if story_id_obj:
                            previous_stories_cursor = previous_stories_cursor.find({"_id": {"$ne": story_id_obj}})
                        previous_stories_cursor = previous_stories_cursor.sort("createdAt", -1).limit(5)
                        previous_stories = list(previous_stories_cursor)
                    
                    # If no results, try with string ID
                    if not previous_stories or len(previous_stories) == 0:
                        previous_stories_cursor = stories_collection.find({
                            "$or": [
                                {"child": story.child_id},
                                {"child_id": story.child_id}, 
                                {"childId": story.child_id},
                                {"author": story.child_id}
                            ]
                        })
                        if story.id:
                            previous_stories_cursor = previous_stories_cursor.find({"_id": {"$ne": story.id}})
                        previous_stories_cursor = previous_stories_cursor.sort("createdAt", -1).limit(5)
                        previous_stories = list(previous_stories_cursor)
                    
                    print(f"Found {len(previous_stories)} previous stories for analysis context")
                except Exception as db_err:
                    print(f"Error fetching previous stories: {db_err}")
                    previous_stories = []
            except Exception as db_err:
                print(f"Error fetching child data or previous stories: {db_err}")
        
        # Format previous stories for context
        previous_stories_text = ""
        if previous_stories:
            previous_stories_text = "Previously written stories:\n"
            for i, prev_story in enumerate(previous_stories):
                prev_content = prev_story.get("content", "")
                if prev_content:
                    previous_stories_text += f"Story {i+1}: {prev_content}\n"
        
        # Prepare input data for the AI model
        child_age = calculate_age(child_data) if child_data else "unknown"
        child_name = child_data.get("name", "the child") if child_data else "the child"
        
        # Set up the content for the OpenRouter API request
        system_message = f"""You are an expert child psychologist and educator analyzing a child's story or drawing description.
        
The story was created by {child_name}, who is {child_age} years old.

Analyze this content deeply to identify:
1. Strengths: What cognitive, creative, or emotional strengths does this story reveal?
2. Traits: What personality traits or thinking styles are evident?
3. Summary: Provide a brief 1-2 sentence summary of the key developmental insights.
4. AI Insights: Provide 3-4 paragraphs of detailed developmental analysis, including cognitive patterns, emotional themes, and educational recommendations.

YOU MUST FORMAT YOUR RESPONSE AS A VALID JSON OBJECT with these exact keys: strengths, traits, summary, ai_insights.
- strengths and traits should be arrays of 3-5 specific words or short phrases each
- summary should be a string with 1-2 sentences
- ai_insights should be a string with your detailed analysis

EXAMPLE FORMAT:
{{"strengths": ["creativity", "empathy", "detail-oriented"], 
"traits": ["reflective", "considerate", "expressive"],
"summary": "This story demonstrates the child's ability to understand different perspectives and strong emotional intelligence.",
"ai_insights": "The child shows exceptional ability to... This suggests a developmental pattern of... Parents and educators should..."}}

DO NOT include any text outside of the JSON object. DO NOT use markdown, LaTeX or other formatting."""
        
        # Make the request to OpenRouter
        print(f"Sending story to OpenRouter for analysis...")
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": SITE_URL,
            "X-Title": SITE_NAME,
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": f"Here is the story to analyze:\n\n{story.content}\n\n{previous_stories_text}"}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        start_request = time.time()
        response = requests.post(
            OPENROUTER_API_ENDPOINT,
            headers=headers,
            json=payload
        )
        request_time = time.time() - start_request
        print(f"OpenRouter response received in {request_time:.2f} seconds with status: {response.status_code}")
        
        # Process the response
        if response.status_code == 200:
            result = response.json()
            answer = result["choices"][0]["message"]["content"]
            print(f"Received answer: {answer[:50]}...")
            
            # Extract the analysis from the response
            try:
                import json
                import re
                
                # Try different approaches to parse the JSON from the response
                json_content = None
                
                # Log raw answer for debugging
                print(f"Raw answer from OpenRouter (first 100 chars): {answer[:min(100, len(answer))]}")
                
                # Approach 1: Try directly parsing the entire response as JSON
                try:
                    json_content = json.loads(answer)
                    print("✅ Successfully parsed direct JSON response")
                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse as direct JSON: {e}")

                    # Approach 2: Look for JSON patterns with different markdowns
                    if not json_content:
                        # Try to find JSON in markdown code blocks
                        json_patterns = [
                            r'```(?:json)?\s*(\{.*?\})\s*```',  # Markdown code block with optional json tag
                            r'`(\{.*?\})`',                     # Inline code block
                            r'(\{[\s\S]*"strengths"[\s\S]*\})'  # Any JSON-like block with "strengths" key
                        ]
                        
                        for pattern in json_patterns:
                            match = re.search(pattern, answer, re.DOTALL)
                            if match:
                                try:
                                    json_content = json.loads(match.group(1).strip())
                                    print(f"✅ Successfully parsed JSON from markdown with pattern: {pattern[:20]}...")
                                    break
                                except json.JSONDecodeError:
                                    continue
                
                # Approach 3: If still no JSON, try to find key sections manually
                if not json_content:
                    print("⚠️ Attempting manual section extraction from text...")
                    # Extract sections from text
                    strengths = extract_list_items(extract_section(answer, "strengths"))
                    traits = extract_list_items(extract_section(answer, "traits"))
                    summary = extract_section(answer, "summary")
                    ai_insights = extract_section(answer, "ai_insights") or extract_section(answer, "insights") or answer
                    
                    if strengths or traits or summary or ai_insights:
                        print(f"✅ Manually extracted sections: found {len(strengths)} strengths, {len(traits)} traits")
                        json_content = {
                            "strengths": strengths,
                            "traits": traits, 
                            "summary": summary,
                            "ai_insights": ai_insights
                        }
                    else:
                        print("❌ Manual extraction failed to find any sections")
                        
                # If we still have no content, use defaults
                if not json_content:
                    print("⚠️ Using default content with original answer as AI insights")
                    json_content = {
                        "strengths": ["expression", "communication"],
                        "traits": ["thoughtful", "articulate"],
                        "summary": "The child shows expressive abilities in their writing.",
                        "ai_insights": answer  # Use the entire answer as insights
                    }
                
                # Check content quality and fix missing fields
                if not json_content.get("strengths") or len(json_content.get("strengths", [])) < 2:
                    print("⚠️ Fixing missing or insufficient strengths")
                    json_content["strengths"] = json_content.get("strengths", []) or ["creativity", "expression"]
                    if len(json_content["strengths"]) < 2:
                        json_content["strengths"].append("communication")
                
                if not json_content.get("traits") or len(json_content.get("traits", [])) < 2:
                    print("⚠️ Fixing missing or insufficient traits")
                    json_content["traits"] = json_content.get("traits", []) or ["thoughtful", "expressive"]
                    if len(json_content["traits"]) < 2:
                        json_content["traits"].append("observant")
                
                if not json_content.get("summary") or len(json_content.get("summary", "")) < 10:
                    print("⚠️ Fixing missing or short summary")
                    json_content["summary"] = json_content.get("summary") or "This story shows the child's ability to express thoughts clearly."
                
                if not json_content.get("ai_insights") or len(json_content.get("ai_insights", "")) < 50:
                    print("⚠️ Fixing missing or short AI insights")
                    # Use the original answer if available, or create a default insight
                    json_content["ai_insights"] = json_content.get("ai_insights") or answer or "The child demonstrates good communication skills in this story, showing an ability to convey thoughts and experiences. This indicates developmental progress in literacy and self-expression."
                
                # Create the final analysis object
                analysis = StoryAnalysis(
                    strengths=json_content.get("strengths")[:5],  # Limit to 5 items
                    traits=json_content.get("traits")[:5],        # Limit to 5 items
                    summary=json_content.get("summary"),
                    ai_insights=json_content.get("ai_insights"),
                    related_story_ids=[]
                )
                
                print(f"✅ Final analysis object created with {len(analysis.strengths)} strengths, {len(analysis.traits)} traits")
                print(f"Summary: {analysis.summary[:50]}...")
                
                # Store the analysis in MongoDB if connected
                if mongodb_connected and db is not None and story.id:
                    try:
                        stories_collection = db.stories
                        
                        # Try to convert ID to ObjectId or use the string ID
                        story_id_obj = story.get_id_as_object_id()
                        
                        # Log which ID format we're using
                        if story_id_obj:
                            print(f"Updating story with ObjectId: {story_id_obj}")
                            query = {"_id": story_id_obj}
                        else:
                            print(f"Updating story with string ID: {story.id}")
                            query = {"_id": story.id}
                        
                        # Update the story with the analysis
                        update_result = stories_collection.update_one(
                            query,
                            {"$set": {
                                "aiAnalysis": {
                                    "strengths": analysis.strengths,
                                    "traits": analysis.traits,
                                    "summary": analysis.summary,
                                    "ai_insights": analysis.ai_insights,
                                    "related_story_ids": analysis.related_story_ids
                                }
                            }}
                        )
                        
                        if update_result.matched_count > 0:
                            print(f"Analysis stored in database for story {story.id}")
                        else:
                            print(f"Warning: No document matched for story ID: {story.id}")
                            
                    except Exception as update_err:
                        print(f"Error updating story with analysis: {update_err}")
                        # Continue anyway - we still want to return the analysis
                
                total_time = time.time() - start_time
                print(f"Analysis completed in {total_time:.2f}s")
                return analysis
                
            except Exception as parse_err:
                print(f"Error parsing AI response: {parse_err}")
                raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(parse_err)}")
        else:
            print(f"Error from OpenRouter API: {response.status_code}")
            print(f"Response content: {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"OpenRouter API error: {response.text}")
    
    except Exception as e:
        print(f"Error in analyze_story: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Story analysis failed: {str(e)}")

@app.post("/api/stories/tokenize", response_model=TokenizedStory)
async def tokenize_story(story: Story):
    try:
        # Placeholder for tokenization and embedding generation
        # In production, replace with actual tokenization and embedding generation
        tokens = [{"token": word, "pos": "NOUN"} for word in story.content.split()]
        
        # Placeholder vector embedding (128-dimensional)
        vector_embedding = [0.1] * 128
        
        # Store vector embedding in MongoDB if connected
        if mongodb_connected and db and story.id:
            try:
                stories_collection = db["stories"]
                stories_collection.update_one(
                    {"_id": ObjectId(story.id)},
                    {"$set": {"vectorEmbedding": vector_embedding, "tokens": tokens}}
                )
            except Exception as mongo_error:
                print(f"Error saving tokenization to MongoDB: {mongo_error}")
        
        return {
            "tokens": tokens,
            "vector_embedding": vector_embedding
        }
        
    except Exception as e:
        print(f"Error in tokenize_story: {e}")
        return {
            "tokens": [{"token": "error", "pos": "NOUN"}],
            "vector_embedding": [0.0] * 128
        }

@app.get("/api/stories/similar/{story_id}", response_model=List[Dict[str, Any]])
async def find_similar_stories(story_id: str):
    try:
        # Check if MongoDB is connected
        if not mongodb_connected or not db:
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
            
            # Find similar stories
            # In production, use a vector database or proper similarity search
            # This is just a placeholder that returns the most recent stories
            similar_stories = list(stories_collection.find(
                {"child": child_id, "_id": {"$ne": ObjectId(story_id)}}
            ).sort("createdAt", -1).limit(3))
            
            # Format the response
            result = []
            for s in similar_stories:
                result.append({
                    "id": str(s["_id"]),
                    "content": s["content"],
                    "similarity_score": 0.85,  # Placeholder
                    "created_at": s.get("createdAt")
                })
            
            return result
        except Exception as mongo_error:
            print(f"Error accessing MongoDB for similar stories: {mongo_error}")
            return []
            
    except Exception as e:
        print(f"Error in find_similar_stories: {e}")
        return []

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
        
        # Call the analyze_story function
        print("Calling analyze_story function...")
        analysis = await analyze_story(story)
        
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
    
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    try:
        print("Sending test question to OpenRouter...")
        start_time = time.time()
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": SITE_URL,
            "X-Title": SITE_NAME,
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant. Provide clear, concise answers in plain text format. Do not use LaTeX, markdown, or other formatting. For example, answer '206' instead of '\\boxed{206}'."},
                {"role": "user", "content": request_data.get("question")}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        response = requests.post(
            OPENROUTER_API_ENDPOINT,
            headers=headers,
            json=payload
        )
        
        elapsed_time = time.time() - start_time
        print(f"OpenRouter response received in {elapsed_time:.2f} seconds with status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            answer = result["choices"][0]["message"]["content"]
            print(f"Received answer: {answer[:20]}...")
            
            return {
                "answer": answer,
                "elapsed_time_seconds": elapsed_time,
                "status_code": response.status_code
            }
        else:
            print(f"OpenRouter API error: Status {response.status_code}, {response.text}")
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"OpenRouter API error: {response.text}"
            )
            
    except Exception as e:
        error_message = str(e)
        print(f"Error in test endpoint: {error_message}")
        raise HTTPException(status_code=500, detail=f"Test request failed: {error_message}")

@app.get("/config")
async def get_config():
    """Get current configuration values for debugging"""
    return {
        "mongodb_status": "connected" if mongodb_connected else "disconnected",
        "openrouter_model": OPENROUTER_MODEL,
        "openrouter_api": "configured" if OPENROUTER_API_KEY else "not configured",
        "environment": "production" if os.getenv("ENVIRONMENT") == "production" else "development"
    }

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

# Run the server with: uvicorn app:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
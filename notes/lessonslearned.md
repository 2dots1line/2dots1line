# Lessons Learned: Integrating AI Analysis in a Web Application

This document outlines the step-by-step process for integrating AI-powered analysis features into a web application, based on our experience with the 2Dots1Line project.

## 1. Setting Up the Backend API

### 1.1. Environment Configuration

First, set up the necessary environment variables for your AI API:

```python
# OpenRouter configuration
OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")
SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")
SITE_NAME = os.getenv("SITE_NAME", "2Dots1Line")
```

Make your model choice configurable via environment variables to easily switch between models:

```
# .env file example
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=deepseek/deepseek-chat
```

### 1.2. Setting Up API Endpoints

Create both direct and analysis-specific endpoints:

1. **Test Endpoint**: For simple verification of API connectivity

```python
@app.post("/api/test/ask")
async def test_ask_question(request_data: dict):
    if not request_data.get("question"):
        raise HTTPException(status_code=400, detail="No question provided")
    
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
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
                {"role": "system", "content": "You are a helpful assistant."},
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
            
            return {
                "answer": answer,
                "elapsed_time_seconds": elapsed_time,
                "status_code": response.status_code
            }
        else:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"OpenRouter API error: {response.text}"
            )
            
    } catch (Exception e) {
        raise HTTPException(status_code=500, detail=f"Test request failed: {str(e)}")
    }
```

2. **Analysis Endpoint**: For processing story content with specific prompts

```python
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
        
        # Call the analyze_story function
        analysis = await analyze_story(story) # Implementation detailed in Section 1.3
        
        elapsed_time = time.time() - start_time
        print(f"Direct analysis completed in {elapsed_time:.2f}s")
        return analysis
        
    except Exception as e:
        print(f"Error in direct_analyze: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
```

### 1.3. Implementing Story Analysis

Create a detailed analysis function that:
- Fetches context (like previous stories)
- Uses a carefully crafted prompt
- Handles API responses and errors
- Stores the results in your database

```python
@app.post("/api/stories/analyze", response_model=StoryAnalysis)
async def analyze_story(story: Story):
    start_time = time.time()
    
    try:
        # Get context from database (child info, previous stories, etc.)
        
        # Craft a detailed system message for the AI
        system_message = f"""You are an expert child psychologist and educator analyzing a child's story.
        
The story was created by {child_name}, who is {child_age} years old.

Analyze this content deeply to identify:
1. Strengths: What cognitive, creative, or emotional strengths does this story reveal?
2. Traits: What personality traits or thinking styles are evident?
3. Summary: Provide a brief 1-2 sentence summary of the key developmental insights.
4. AI Insights: Provide 3-4 paragraphs of detailed developmental analysis.

Format your analysis as a JSON object with these exact keys: strengths, traits, summary, ai_insights."""
        
        # Make the API request
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
        
        response = requests.post(
            OPENROUTER_API_ENDPOINT,
            headers=headers,
            json=payload
        )
        
        # Process and parse the response
        if response.status_code == 200:
            result = response.json()
            answer = result["choices"][0]["message"]["content"]
            
            # Parse the response (often needs to handle multiple formats)
            # Store in database
            # Return structured analysis
        else:
            # Handle API errors
        
    } catch (Exception e) {
        // Log and handle errors
    }
}
```

### 1.4. Configuration Endpoint

Add a configuration endpoint for easy debugging:

```python
@app.get("/config")
async def get_config():
    """Get current configuration values for debugging"""
    return {
        "mongodb_status": "connected" if mongodb_connected else "disconnected",
        "openrouter_model": OPENROUTER_MODEL,
        "openrouter_api": "configured" if OPENROUTER_API_KEY else "not configured",
        "environment": "production" if os.getenv("ENVIRONMENT") == "production" else "development"
    }
```

## 2. Frontend Integration

### 2.1. Setting Up Test Interface

Create a dedicated test page to verify AI connectivity:

```jsx
export default function TestAI() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseTime, setResponseTime] = useState(null);
  
  const handleAsk = async () => {
    setIsLoading(true);
    setError('');
    setAnswer('');
    
    const startTime = Date.now();
    
    try {
      const response = await fetch('http://localhost:8000/api/test/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      setResponseTime({
        totalTime: `${totalTime}s (client)`,
        backendTime: data.elapsed_time_seconds ? `${data.elapsed_time_seconds.toFixed(2)}s (server)` : 'unknown'
      });
      
      if (data.answer) {
        setAnswer(data.answer);
      } else {
        setError('No answer received from the AI service');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // JSX for the form and display...
}
```

### 2.2. Implementing Analysis Request and Display

Implement the analysis request function in your story view:

```jsx
const requestAnalysis = async (storyData) => {
  try {
    setAnalysisLoading(true);
    setAnalysisError('');
    
    // Ensure correct field names from the story object
    const storyId = storyData._id;  // MongoDB uses _id
    const content = storyData.content;
    const childId = storyData.child;  // Field named 'child', not 'child_id'
    
    // Additional validation 
    if (!storyId || !childId || !content) {
      throw new Error('Missing required story data');
    }
    
    // Make the request
    const response = await fetch('http://localhost:8000/api/direct/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: storyId,
        content: content,
        child_id: childId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis request failed: ${response.status}. Details: ${errorText}`);
    }

    const data = await response.json();
    
    // Update the story with analysis
    await updateStoryWithAnalysis(storyData._id, data);
    
    // Refresh the UI
    await fetchStory(storyData._id);
  } catch (error) {
    setAnalysisError(`Error: ${error.message}`);
  } finally {
    setAnalysisLoading(false);
  }
};
```

### 2.3. Storing Analysis Results

Create a function to store analysis in your database:

```jsx
const updateStoryWithAnalysis = async (storyId, analysisData) => {
  try {
    // Validate storyId
    if (!storyId) {
      throw new Error('Missing storyId for database update');
    }
    
    // Create the structured analysis object
    const aiAnalysis = {
      strengths: analysisData.strengths || [],
      traits: analysisData.traits || [],
      summary: analysisData.summary || '',
      ai_insights: analysisData.ai_insights || ''
    };
    
    // Send to your API
    const updateResponse = await fetch(`/api/stories/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        storyId: storyId,
        aiAnalysis: aiAnalysis
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update story: ${updateResponse.status}. Details: ${errorText}`);
    }
    
    return true;
  } catch (updateErr) {
    console.error("Error updating story:", updateErr);
    throw updateErr;
  }
};
```

### 2.4. Handling User Interface States

Implement UI elements to handle various states:

```jsx
// Loading state
{analysisLoading && (
  <div className="bg-blue-50 p-4 rounded-md">
    <h3 className="text-sm font-medium text-blue-800 mb-2">What's happening?</h3>
    <p className="text-sm text-blue-700 mb-2">
      The AI model is analyzing the story. This process usually takes 30-60 seconds.
    </p>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{width: '100%'}}></div>
    </div>
  </div>
)}

// Error state
{analysisError && (
  <p className="text-red-600 mb-3">Error: {analysisError}</p>
)}

// Result display (when available)
{story.aiAnalysis && (
  <div className="bg-white shadow-sm rounded-lg p-6">
    <h2 className="text-xl font-medium text-indigo-700 mb-4">AI Insights</h2>
    
    {story.aiAnalysis.strengths && (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Key Strengths</h3>
        <ul className="list-disc pl-5 space-y-1">
          {story.aiAnalysis.strengths.map((strength, index) => (
            <li key={index} className="text-gray-700">{strength}</li>
          ))}
        </ul>
      </div>
    )}
    
    {/* Similar sections for traits, summary, and insights */}
  </div>
)}
```

## 3. Error Handling and Debugging

### 3.1. Handling API Timeouts

AI services can be slow. Handle long-running requests properly:

```javascript
// Log timing information
start_time = time.time()
// ...process
elapsed_time = time.time() - start_time
console.log(`Operation completed in ${elapsed_time.toFixed(2)}s`)

// Add detailed error logging
try {
  // operation
} catch (err) {
  console.error("Detailed error:", err);
  // Log specific info about what failed
}
```

### 3.2. Field Name Consistency

Ensure field names are consistent between frontend and backend:

```javascript
// Correct:
const storyId = storyData._id;  // MongoDB uses _id
const childId = storyData.child;  // Field is named 'child' not 'child_id'

// Using with validation:
if (!storyId || !childId) {
  console.error("Missing required fields:", { 
    _id: storyId, 
    child: childId 
  });
  throw new Error('Missing required story data');
}
```

### 3.3. Database ID Handling

Handle MongoDB ObjectId conversions properly:

```python
def get_id_as_object_id(self):
    """Safely convert id to ObjectId or return None if not possible"""
    if not self.id:
        return None
    try:
        return ObjectId(self.id)
    except Exception:
        return None
```

### 3.4. Server Management Scripts

Create scripts to manage your backend server:

```bash
#!/bin/bash

# Find and kill processes using port 8000
PORT_USERS=$(lsof -i :8000 | grep LISTEN)
if [ -n "$PORT_USERS" ]; then
    PIDS=$(echo "$PORT_USERS" | awk '{print $2}')
    for PID in $PIDS; do
        echo "Killing process $PID..."
        kill -9 $PID
    done
fi

# Start the backend server
cd backend
uvicorn app:app --reload &
```

## 4. Special Features

### 4.1. Child Account Activation System

Implement a secure activation process:

1. Create an activation page:
   ```jsx
   export default function Activate() {
     const [activationCode, setActivationCode] = useState('');
     const [isVerifying, setIsVerifying] = useState(false);
     
     const handleVerifyCode = async (e) => {
       e.preventDefault();
       setIsVerifying(true);
       
       try {
         const response = await fetch('/api/users/verify-activation', {
           method: 'POST',
           body: JSON.stringify({ activationCode }),
           // ...
         });
         
         if (response.ok) {
           // Redirect to signup with the code
           router.push({
             pathname: '/signup',
             query: { role: 'child', activationCode }
           });
         }
       } catch (err) {
         // Handle errors
       }
     };
     
     // Form JSX
   }
   ```

2. Update the user creation API:
   ```javascript
   // If this is a child account with activation code, verify and update
   if (role === 'child' && activationCode) {
     const existingChild = await User.findOne({ 
       activationCode: activationCode,
       role: 'child'
     });
     
     if (!existingChild) {
       return res.status(400).json({ error: "Invalid activation code" });
     }
     
     // Update the existing child account
     existingChild.name = name;
     existingChild.email = email;
     existingChild.passwordHash = password;
     existingChild.activated = true;
     
     await existingChild.save();
   }
   ```

## 5. Troubleshooting Guide

When implementing AI features, you may encounter these common issues:

1. **API Timeouts**: AI models can take 30-60 seconds to respond. Monitor response times and adjust timeouts accordingly.

2. **Invalid Model Selection**: Not all models support all features. Test thoroughly when switching models.

3. **Field Name Mismatches**: MongoDB often uses `_id` rather than `id`. Ensure your frontend matches backend expectations.

4. **Database ID Format**: Always handle ObjectId conversion carefully, providing fallbacks for string IDs.

5. **Port Conflicts**: Backend servers can get stuck. Use the provided scripts to manage the server process.

6. **Cross-Origin Issues**: Ensure your CORS settings are configured properly:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000", "*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"]
   )
   ```

## 6. Conclusion

Integrating AI features requires attention to:

1. **Proper Error Handling**: Always provide meaningful errors and fallbacks
2. **Clear User Feedback**: Show loading states and progress indicators
3. **Flexible Configuration**: Make AI model selection configurable
4. **Thorough Testing**: Create dedicated test pages and endpoints
5. **Database Consistency**: Ensure field names and ID formats match

By following these lessons, you can successfully integrate AI features into your web application and provide a robust, user-friendly experience. 
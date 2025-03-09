# 2Dots1Line

Note to self: 

Start the frontend server:
# in the root directory
npm run dev

Start the backend server:
cd backend
source venv/bin/activate
uvicorn app:app --reload

If backend server says address is not available, find and kill the existing process
# Find the process using port 8000
lsof -i :8000
# Kill it (replace PID with the process ID from above)
kill PID

or Use a different port
uvicorn app:app --reload --port 8001

# First make the script executable
chmod +x restart-backend.sh

# Then run it
./restart-backend.sh

Test the API directly
Visit http://localhost:8000 to see if the server is running
Visit http://localhost:8000/health to see the status of connections
Visit http://localhost:8000/test-openrouter to test OpenRouter connectivity
Test with the frontend:
Create a new story
View the story to check for AI insights

Go to http://localhost:3000/test-ai
Enter a simple question (e.g., "How many bones does a human have?")
Click "Ask Question"
This will directly test the connection to OpenRouter without any story analysis logic
An AI-powered interactive storytelling canvas designed for parents to document and explore their child's personal growth through stories.


   # Kill and restart backend
   ./restart-backend.sh
   
   # In a separate terminal, restart frontend
   cd frontend
   npm run dev

  curl http://localhost:8000/health
     curl http://localhost:8000/config
        curl -X POST -H "Content-Type: application/json" -d '{"question": "What is 2+2?"}' http://localhost:8000/api/test/ask
   Check backend health:
Open http://localhost:8000/health in your browser or use:
health
You should see a response indicating the server is healthy.
Check configuration:
config
Verify that openrouter_model shows your selected model.
Test direct AI connection:
ask
You should get a response with the answer.
Web UI Testing:
Navigate to http://localhost:3000/test-ai
Enter a simple question like "What is 2+2?"
Click "Ask AI" and verify you get a response
Try "Test Story Analysis" with a sample story

Commit to GitHub

First, let's check the current status of your repository to see what changes need to be committed.
git status

Step 1: Add your files to the staging area
First, let's add all the files to the staging area. However, we should be careful not to include unnecessary files like the virtual environment (.venv) and build artifacts (.next). Let's create a proper .gitignore file first:



## Project Overview

2Dots1Line is a web application that allows parents to:
- Create and manage a household with multiple children
- Document stories about their children's experiences and development
- Receive AI-powered insights about their child's strengths, traits, and development patterns
- Visualize growth and development over time

The application consists of:
- Next.js frontend for the web interface
- MongoDB database for data storage
- FastAPI backend for AI processing and analysis

## Environment Configuration

The application uses environment variables for configuration. These can be set in either:

1. **Root directory `.env.local`** (for Next.js frontend)
2. **Backend directory `.env`** (for FastAPI backend)

### Important Configuration Notes

- **JWT_SECRET vs OPENROUTER_API_KEY**: In the frontend code, we use JWT_SECRET for authentication. In the backend, this same value is used as the OPENROUTER_API_KEY for AI analysis.

  - The backend will automatically use JWT_SECRET as OPENROUTER_API_KEY if:
    - OPENROUTER_API_KEY is not explicitly set in backend/.env
    - JWT_SECRET is found in the root .env.local file

### Required Environment Variables

```
# MongoDB connection string
MONGODB_URI=your_mongodb_connection_string

# Authentication token secret (also used as OpenRouter API key)
JWT_SECRET=your_openrouter_api_key  

# Site information for OpenRouter 
SITE_URL=http://localhost:3000
SITE_NAME=2Dots1Line
```

### Troubleshooting Environment Issues

If you encounter "environment variable not set" errors:

1. Make sure `.env` exists in the backend directory with proper values
2. When running backend server, ensure you're in the correct directory:
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uvicorn app:app --reload
   ```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- Python (v3.9+)
- MongoDB account

### Environment Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/2dots1line.git
cd 2dots1line
```

2. Install frontend dependencies:
```
npm install
```

3. Set up Python virtual environment for the backend:
```
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. Install required Python packages:
```
pip install python-dotenv==1.0.0 pymongo==4.3.3 fastapi==0.95.1 uvicorn==0.22.0 requests==2.29.0
```

5. Create `.env` in the backend directory with:
```
MONGODB_URI=your_mongodb_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key
SITE_URL=http://localhost:3000
SITE_NAME=2Dots1Line
```

### Running the Application

1. Start the Next.js frontend:
```
npm run dev
```

2. Start the FastAPI backend:
```
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app:app --reload
```

3. Access the application at http://localhost:3000

## Testing the AI Integration

After starting both frontend and backend:

1. Create a new story in the frontend
2. View the story after creation
3. Check for the AI Insights section showing:
   - Key strengths
   - Character traits
   - Summary
   - Detailed analysis

If AI insights don't appear:
- Visit http://localhost:8000/test-openrouter to check API connectivity
- Verify your OpenRouter API key is configured correctly

## OpenRouter Integration

The application uses OpenRouter with the DeepSeek R1 model for AI analysis. To enable this feature:

1. Sign up for an account at [OpenRouter](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Add the API key to your backend `.env` file as OPENROUTER_API_KEY
4. Restart both frontend and backend servers

## Current State

The project is in active development with the following features implemented:
- User authentication (login/signup)
- Household management
- Child account creation and activation
- Story creation and management
- AI analysis using OpenRouter (DeepSeek R1 model)

## Recent Updates

1. **Improved Child Activation Process**:
   - Activation codes and links are now persistently displayed in the parent dashboard
   - Child activation status is clearly visible to parents
   - Two-step activation process for children with code verification

2. **Enhanced Story Creation**:
   - Fixed "Add a new story" button to work without requiring child selection first
   - Added child selection dropdown when multiple children exist
   - Improved validation and error handling

3. **AI Integration with OpenRouter**:
   - Integrated with OpenRouter API using DeepSeek R1 model
   - Added robust parsing of AI responses
   - Implemented fallback mechanisms for when AI is unavailable

4. **Security Improvements**:
   - Enhanced password handling and storage
   - Improved JWT authentication
   - Added proper error handling throughout the application

## Next Steps

1. Enhance visualization of child development over time
2. Add media upload capabilities for stories
3. Implement more advanced AI analysis features
4. Add notification system for new stories and insights
5. Improve mobile responsiveness 
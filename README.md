# 2Dots1Line

AI-powered interactive storytelling platform for parents to document and explore their child's personal growth through stories.

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
- Optional Ollama integration for local AI processing

## Setup Instructions

For detailed setup and server management instructions, please refer to the [Server Management Guide](SERVER-MANAGEMENT-GUIDE.md).

### Prerequisites
- Node.js (v14+)
- Python (v3.9+)
- MongoDB account
- Ollama (optional, for local AI processing)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/2dots1line.git
cd 2dots1line
```

2. Install frontend dependencies:
```bash
npm install
```

3. Set up Python virtual environment for the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. Create `.env` in the backend directory with:
```
MONGODB_URI=your_mongodb_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key
SITE_URL=http://localhost:3000
SITE_NAME=2Dots1Line

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001
CORS_ALLOW_ALL=false

# AI Provider Selection: openrouter or ollama
AI_PROVIDER=ollama

# OpenRouter Configuration
OPENROUTER_MODEL=deepseek/deepseek-chat

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Sentence Transformer model for embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### Running the Application

1. Start the Next.js frontend:
```bash
npm run dev
```

2. Start the FastAPI backend:
```bash
cd backend
source venv/bin/activate
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
- Visit http://localhost:8000/health to check system status
- Use http://localhost:8000/api/status/ai-requests to monitor AI processing
- Try http://localhost:8000/api/test/ask to test direct AI queries

## Environment Configuration

The application uses environment variables for configuration. These can be set in either:

1. **Root directory `.env.local`** (for Next.js frontend)
2. **Backend directory `.env`** (for FastAPI backend)

### Important Configuration Notes

- **JWT_SECRET vs OPENROUTER_API_KEY**: In the frontend code, we use JWT_SECRET for authentication. In the backend, this same value is used as the OPENROUTER_API_KEY for AI analysis.

  - The backend will automatically use JWT_SECRET as OPENROUTER_API_KEY if:
    - OPENROUTER_API_KEY is not explicitly set in backend/.env
    - JWT_SECRET is found in the root .env.local file

## Current State

The project is in active development with the following features implemented:
- User authentication (login/signup)
- Household management
- Child account creation and activation
- Story creation and management
- AI analysis using either OpenRouter or local Ollama models
- Story vectorization for similarity matching
- Real-time AI processing monitoring

## Recent Updates

1. **Improved AI Provider Flexibility**:
   - Added support for Ollama as an alternative to OpenRouter
   - Implemented provider switching via API endpoints
   - Added configuration for different AI models
   - Extended timeout for large models like qwq:32B

2. **Enhanced Story Vectorization**:
   - Implemented sentence-transformers for embedding generation
   - Added similarity search for finding related stories
   - Created schema upgrade tools for adding vector fields
   - Added batch processing for vectorizing existing stories

3. **Improved AI Response Parsing**:
   - Enhanced robustness of parsing AI responses into structured data
   - Fixed issues with missing strengths and traits
   - Removed markdown artifacts from AI outputs
   - Implemented fallback logic for incomplete responses

4. **Backend Monitoring & Debugging**:
   - Added real-time monitoring of AI requests
   - Fixed MongoDB connection validation
   - Added detailed logging for troubleshooting
   - Created backward compatibility endpoints

5. **Documentation & Guides**:
   - Created comprehensive server management guide
   - Updated environment variable documentation
   - Added detailed testing procedures
   - Improved troubleshooting instructions

## Next Steps

1. Enhance visualization of child development over time
2. Add media upload capabilities for stories
3. Create user profile management features
4. Implement batch exports of stories and insights
5. Create a guided tour for new users 
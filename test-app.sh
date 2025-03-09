#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}2Dots1Line Application Test Script${NC}"
echo "========================================"

# Check if MongoDB URI is configured
if grep -q "MONGODB_URI" .env.local; then
  echo -e "${GREEN}✓ MongoDB URI is configured${NC}"
else
  echo -e "${RED}✗ MongoDB URI is not configured${NC}"
  echo "Please add your MongoDB connection string to .env.local"
fi

# Check if JWT_SECRET is configured
if grep -q "JWT_SECRET" .env.local; then
  echo -e "${GREEN}✓ JWT_SECRET is configured${NC}"
else
  echo -e "${RED}✗ JWT_SECRET is not configured${NC}"
  echo "Please add a JWT_SECRET to .env.local"
fi

# Check if AI_API_KEY is configured
if grep -q "AI_API_KEY=" .env.local && ! grep -q "# AI_API_KEY" .env.local; then
  echo -e "${GREEN}✓ AI_API_KEY is configured${NC}"
else
  echo -e "${YELLOW}⚠ AI_API_KEY is not configured${NC}"
  echo "AI features will use placeholder data. Add your AI API key to .env.local when ready."
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}✓ Node.js is installed (${NODE_VERSION})${NC}"
else
  echo -e "${RED}✗ Node.js is not installed${NC}"
  echo "Please install Node.js v14 or higher"
fi

# Check if Python is installed
if command -v python3 &> /dev/null; then
  PYTHON_VERSION=$(python3 --version)
  echo -e "${GREEN}✓ Python is installed (${PYTHON_VERSION})${NC}"
else
  echo -e "${RED}✗ Python is not installed${NC}"
  echo "Please install Python 3.9 or higher"
fi

echo ""
echo -e "${YELLOW}Starting the application:${NC}"
echo "1. Start the Next.js frontend:"
echo "   npm run dev"
echo ""
echo "2. In a separate terminal, start the FastAPI backend:"
echo "   cd backend"
echo "   source venv/bin/activate  # On Windows: venv\\Scripts\\activate"
echo "   uvicorn app:app --reload"
echo ""
echo "3. Access the application at http://localhost:3000"
echo ""
echo -e "${YELLOW}Next steps for AI integration:${NC}"
echo "1. Obtain an API key from an AI provider (OpenAI, Anthropic, etc.)"
echo "2. Add the API key to your .env.local file:"
echo "   AI_API_KEY=your_api_key"
echo "3. Restart both frontend and backend servers"
echo ""
echo "========================================" 
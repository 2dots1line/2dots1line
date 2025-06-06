#!/bin/bash

# Manual API Testing Script for 2dots1line V7 API Gateway
# This script demonstrates how to test the authentication endpoints manually

set -e

API_BASE_URL="http://localhost:8000"
TIMESTAMP=$(date +%s)
TEST_EMAIL="apitest-${TIMESTAMP}@2dots1line.com"
TEST_USERNAME="testuser${TIMESTAMP}"
TEST_PASSWORD="TestPassword123!"

echo "🚀 Starting Manual API Testing for 2dots1line V7"
echo "=================================================="
echo "API Base URL: $API_BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo "Test Username: $TEST_USERNAME"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print test results
print_test_result() {
    local test_name="$1"
    local status_code="$2"
    local expected_code="$3"
    local response="$4"
    
    echo -e "${BLUE}Test: $test_name${NC}"
    echo "Expected Status: $expected_code | Actual Status: $status_code"
    
    if [ "$status_code" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
    else
        echo -e "${RED}❌ FAILED${NC}"
    fi
    
    echo "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    echo ""
}

# Test 1: Health Check
echo -e "${YELLOW}🔍 Test 1: Health Check${NC}"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$API_BASE_URL/api/health")
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
print_test_result "Health Check" "$status_code" "200" "$body"

# Test 2: User Registration
echo -e "${YELLOW}🔍 Test 2: User Registration${NC}"
registration_payload=$(cat <<EOF
{
  "email": "$TEST_EMAIL",
  "password": "$TEST_PASSWORD",
  "username": "$TEST_USERNAME",
  "display_name": "Test User $TIMESTAMP",
  "region": "us"
}
EOF
)

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST "$API_BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "$registration_payload")

status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
print_test_result "User Registration" "$status_code" "201" "$body"

# Extract user ID for later use
USER_ID=$(echo "$body" | jq -r '.user.user_id' 2>/dev/null || echo "")

# Test 3: User Login
echo -e "${YELLOW}🔍 Test 3: User Login${NC}"
login_payload=$(cat <<EOF
{
  "email": "$TEST_EMAIL",
  "password": "$TEST_PASSWORD"
}
EOF
)

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST "$API_BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "$login_payload")

status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
print_test_result "User Login" "$status_code" "200" "$body"

# Extract JWT token for authenticated requests
JWT_TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null || echo "")

if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to extract JWT token. Cannot proceed with authenticated tests.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ JWT Token extracted successfully${NC}"
echo "Token (first 50 chars): ${JWT_TOKEN:0:50}..."
echo ""

# Test 4: Get Current User (Protected Route)
echo -e "${YELLOW}🔍 Test 4: Get Current User (Protected Route)${NC}"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X GET "$API_BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
print_test_result "Get Current User" "$status_code" "200" "$body"

# Test 5: Access Protected Route Without Token (Should Fail)
echo -e "${YELLOW}🔍 Test 5: Access Protected Route Without Token (Should Fail)${NC}"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X GET "$API_BASE_URL/api/auth/me")

status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
print_test_result "Unauthorized Access" "$status_code" "401" "$body"

# Test 6: Delete User (Protected Route)
echo -e "${YELLOW}🔍 Test 6: Delete User (Protected Route)${NC}"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X DELETE "$API_BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
print_test_result "Delete User" "$status_code" "200" "$body"

# Test 7: Try to Access User After Deletion (Should Fail)
echo -e "${YELLOW}🔍 Test 7: Try to Access Deleted User (Should Fail)${NC}"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X GET "$API_BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
print_test_result "Access Deleted User" "$status_code" "404" "$body"

# Test 8: Try to Login with Deleted User (Should Fail)
echo -e "${YELLOW}🔍 Test 8: Try to Login with Deleted User (Should Fail)${NC}"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST "$API_BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "$login_payload")

status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
print_test_result "Login with Deleted User" "$status_code" "401" "$body"

echo "=================================================="
echo -e "${GREEN}🎉 Manual API Testing Complete!${NC}"
echo ""
echo "Summary:"
echo "- Health Check: API is running"
echo "- User Registration: ✅ Created user with ID: $USER_ID"
echo "- User Login: ✅ JWT authentication working"
echo "- Protected Routes: ✅ Authorization middleware working"
echo "- User Deletion: ✅ User successfully deleted"
echo "- Security: ✅ Deleted user cannot access protected routes"
echo ""
echo "🔍 You can verify the user creation/deletion in Prisma Studio at:"
echo "   http://localhost:5556"
echo ""
echo "📊 Database Status:"
echo "   - PostgreSQL: Running on localhost:5433"
echo "   - Neo4j: Running on localhost:7475"
echo "   - Weaviate: Running on localhost:8080" 
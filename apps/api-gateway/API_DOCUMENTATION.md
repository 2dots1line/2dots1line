# 2dots1line API Gateway - Chat Endpoints Documentation

## Overview
The Chat API provides real-time conversation capabilities through the DialogueAgent, enabling users to have meaningful conversations about their personal growth journey.

## Base URL
```
/api/chat
```

## Authentication
All endpoints (except `/health`) require user authentication. The authentication middleware should set `req.user.id` with the authenticated user ID.

---

## Endpoints

### 1. Send Message
**POST** `/api/chat/message`

Send a text message to the DialogueAgent for conversation.

#### Request Body
```typescript
{
  message: string;                    // Required: The user's message text
  conversation_id?: string;           // Optional: ID of existing conversation
  context?: {
    session_id?: string;              // Optional: Session identifier
    trigger_background_processing?: boolean; // Optional: Enable background analysis
    user_preferences?: any;           // Optional: User-specific preferences
  };
}
```

#### Response
```typescript
{
  success: true;
  data: {
    message_id: string;               // Unique ID for the response message
    response: string;                 // DialogueAgent's response text
    conversation_id: string;          // ID of the conversation
    timestamp: string;                // ISO 8601 timestamp
    metadata: {
      response_time_ms: number;       // Processing time in milliseconds
      model_used?: string;            // AI model used for response
      suggested_actions?: Array<{     // Suggested follow-up actions
        action_type: string;
        label: string;
        payload: any;
      }>;
      proactive_insight?: {           // Proactive insight if available
        text: string;
        source_insight_id: string;
        confidence: number;
      };
    };
  };
}
```

#### Example Request
```bash
curl -X POST /api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "I had a breakthrough in understanding my leadership style today.",
    "conversation_id": "conv-12345",
    "context": {
      "trigger_background_processing": true
    }
  }'
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "message_id": "conv-12345-response",
    "response": "That sounds like a significant moment! Can you tell me more about what specifically led to this breakthrough in your leadership understanding?",
    "conversation_id": "conv-12345",
    "timestamp": "2024-11-29T10:30:45.123Z",
    "metadata": {
      "response_time_ms": 150,
      "model_used": "gpt-4",
      "suggested_actions": [
        {
          "action_type": "continue_conversation",
          "label": "Share more details",
          "payload": { "type": "elaboration" }
        }
      ]
    }
  }
}
```

---

### 2. Upload File
**POST** `/api/chat/upload`

Upload a file (image, document) for analysis by the DialogueAgent.

#### Request Body
```typescript
{
  message?: string;                   // Optional: Additional message about the file
  file: {
    filename: string;                 // Name of the uploaded file
    mimetype: string;                 // MIME type of the file
    size: number;                     // Size in bytes
    path: string;                     // Server path to the uploaded file
  };
  conversation_id?: string;           // Optional: ID of existing conversation
  context?: any;                      // Optional: Additional context
}
```

#### Response
```typescript
{
  success: true;
  data: {
    message_id: string;               // Unique ID for the response
    response: string;                 // DialogueAgent's analysis
    conversation_id: string;          // ID of the conversation
    file_analysis: Array<{            // Media content in response
      type: string;
      url: string;
    }>;
    timestamp: string;                // ISO 8601 timestamp
    metadata: {
      file_processed: true;           // Indicates file was processed
      processing_time_ms: number;     // Processing time in milliseconds
      suggested_actions?: Array<any>; // Follow-up suggestions
    };
  };
}
```

---

### 3. Get Conversation History
**GET** `/api/chat/history`

Retrieve conversation history for the authenticated user.

#### Query Parameters
- `conversation_id` (optional): Filter by specific conversation
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

#### Response
```typescript
{
  success: true;
  data: {
    conversations: Array<any>;        // Array of conversation messages
    total_count: number;              // Total number of conversations
    has_more: boolean;                // Whether more results are available
  };
  message?: string;                   // Additional information
}
```

**Note**: This endpoint currently returns a placeholder response. Full conversation persistence will be implemented in a future iteration.

---

### 4. Health Check
**GET** `/api/chat/health`

Check the health status of the chat functionality and DialogueAgent.

#### Response
```typescript
{
  success: true;
  data: {
    dialogueAgent: "operational";     // Status of DialogueAgent
    database: "operational";          // Status of database connection
    toolRegistry: "operational";      // Status of tool registry
    timestamp: string;                // ISO 8601 timestamp
  };
}
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "dialogueAgent": "operational",
    "database": "operational",
    "toolRegistry": "operational",
    "timestamp": "2024-11-29T10:30:45.123Z"
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```typescript
{
  success: false;
  error: string;                      // Error message
  details?: string;                   // Additional error details
}
```

### Common Error Codes
- **401 Unauthorized**: User authentication required
- **400 Bad Request**: Invalid request data (e.g., missing message)
- **500 Internal Server Error**: Server-side processing error

#### Example Error Response
```json
{
  "success": false,
  "error": "Message content is required",
  "details": "The 'message' field cannot be empty"
}
```

---

## Integration Notes

### Frontend Integration
To integrate with the frontend:

1. **Authentication**: Ensure proper JWT token or session management
2. **WebSocket**: Consider WebSocket upgrade for real-time conversations
3. **File Upload**: Use multipart/form-data for file uploads with multer middleware
4. **Error Handling**: Implement proper error boundaries and user feedback

### Rate Limiting
Consider implementing rate limiting for production:
- Message endpoint: 60 requests per minute per user
- Upload endpoint: 10 requests per minute per user
- Health endpoint: No rate limiting (monitoring)

### Conversation Persistence
Future implementation will include:
- Message storage in PostgreSQL
- Conversation threading
- Search capabilities
- Export functionality

---

## Technical Architecture

### Components
- **ChatController**: Handles HTTP request/response logic
- **DialogueAgent**: Core conversational AI powered by BaseAgent framework
- **DatabaseService**: Handles data persistence
- **ToolRegistry**: Manages available tools for agent interactions

### Type Safety
All endpoints use TypeScript with shared type definitions from `@2dots1line/shared-types`:
- `TDialogueAgentInput`: Input structure for DialogueAgent
- `TDialogueAgentOutput`: Output structure from DialogueAgent
- Full type safety throughout the request/response pipeline

### Performance
- Current response times: ~150ms average
- Optimized for real-time conversation flow
- Background processing available for complex analysis 
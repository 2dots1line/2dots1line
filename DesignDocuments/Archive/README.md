# 2Dots1Line - Hybrid AI System + Unified Admin Panel

This repository contains the implementation of a Hybrid AI System and Unified Admin Panel as described in the Product Design Requirement (PDR) document. The system aims to provide an emotionally intelligent, strategic AI companion platform that supports user storytelling, memory formation, insight generation, and planning.

## Project Structure

- `prisma/`: Contains the database schema and migrations
- `src/`: Source code for the backend application
  - `controllers/`: API controllers for handling business logic
  - `routes/`: API routes for handling HTTP requests
  - `middleware/`: Custom middleware (e.g., authentication)
  - `models/`: Database models and utilities
- `test-*.js`: Test scripts for different API modules

## Progress

### Completed

1. **Backend Database Schema Setup**
   - Designed and implemented the relational database schema using Prisma
   - Created models for Users, Interactions, Cards, Decks, and Card-Deck Mapping
   - Set up PostgreSQL database and ran initial migrations

2. **User Management APIs**
   - Created API endpoints to manage users (CRUD operations)
   - Implemented proper error handling and input validation
   - Created test script to verify functionality

3. **Authentication APIs**
   - Implemented user signup, login, and logout endpoints
   - Added JWT-based authentication
   - Created middleware for protecting routes
   - Added test script to verify functionality

4. **Basic Frontend Landing Page**
   - Designed and implemented a modern landing page with glassmorphism effects
   - Created login and signup forms that interact with the authentication APIs
   - Added profile page to display user information
   - Implemented session-based authentication on the client side
   - Added custom hero image for enhanced user experience

5. **UI Design Language Documentation**
   - Created comprehensive UI design language documentation in PDR.md
   - Documented typography, color palette, components, iconography, spacing system, UI patterns, and animations
   - Established consistent design principles for future development

6. **AI Companion Integration**
   - Created "Dot" AI assistant with custom SVG icon
   - Integrated Google Gemini API for AI interactions
   - Set up secure API key management through environment variables

7. **Interaction Management APIs**
   - Implemented comprehensive API endpoints for interaction logging and retrieval
   - Added AI response generation for onboarding and chat interactions
   - Created scaffolding for vector and graph database processing
   - Implemented proper security checks for user-specific interactions

8. **Chat Interface for AI Companion**
   - Created dedicated chat page with real-time messaging interface
   - Integrated Dot AI companion with smooth typing indicators
   - Implemented session management for continuous conversations
   - Added message animations and responsive design for all devices

9. **Vector Database Integration (Phase 1)**
   - Implemented embedding generation using Google's Gemini API
   - Created vector storage utilities with placeholder for Milvus integration
   - Added semantic search capabilities based on similarity
   - Built APIs for vector statistics and batch processing
   - Created comprehensive test suite for vector operations

10. **Improved Interaction Logging**
    - Fixed issue where only the first user message per session was logged.
    - Ensured AI responses (`ai_response`) are saved as separate interaction records.
    - Differentiated interaction types for file uploads (`image_upload`, `document_upload`) from standard chat.

11. **File Content Processing & Display**
    - Refactored file uploads to use memory storage instead of disk.
    - Implemented synchronous processing of files (PDF, DOCX, MD, TXT, Images) via a dedicated upload endpoint (`/api/upload/file`).
    - Integrated `pdf-parse` and `mammoth` libraries for text extraction from buffers.
    - Integrated Google Gemini API for image analysis directly from buffer.
    - Backend now immediately returns extracted text/analysis to the frontend.
    - Frontend logic updated to display the returned analysis directly, resolving display delays.
    - Added animated processing indicator for uploads.
    - Fixed markdown formatting in chat display.

### In Progress

- Implementation of full Milvus vector database connection
- Development of Graph Database integration with Neo4j
- Development of Card and Deck Management APIs
- Enhancement of memory visualization components
- Asynchronous vectorization updates for processed file content.
- Implementation of "Thought" extraction from user interactions
- Development of intelligent entity mapping to knowledge graph
- Integration of 3D visualization for vector space and knowledge graph

### Recently Completed

1. **Database Schema Enhancement for Knowledge Graph**
   - Added `Thought` model to store extracted meaningful statements from user interactions
   - Enhanced schema with vector embedding storage capabilities
   - Created one-to-many relationship between `Interaction` and `Thought`
   - Added fields to track subject entity information (`subjectType`, `subjectName`)
   - Connected thoughts to user model for proper ownership tracking

## Lessons Learned

1. **Port Conflicts**
   - Multiple nodemon instances can cause port conflicts
   - Solution: Use different ports for development and testing, properly terminate processes

2. **Database Setup**
   - PostgreSQL user authentication requires careful configuration
   - Solution: Ensure the database connection string has the correct username

3. **JWT Implementation**
   - JWTs are stateless, meaning logout is primarily a client-side operation
   - Consider implementing token blacklisting for more secure logouts

4. **Testing Strategy**
   - Incremental API testing is more effective than building all APIs at once
   - Testing one batch of APIs before moving to the next ensures solid foundations

5. **Interaction Logging Granularity**
   - Logging only user-initiated messages is insufficient for context.
   - Solution: Explicitly save AI responses as separate `Interaction` records with a distinct type (`ai_response`) and link them via `session_id`.

6. **File Handling Workflow & Feedback**
   - Storing files to disk and processing asynchronously introduces complexity (path issues, permissions, delays) and requires a mechanism to feed results back to the user.
   - Solution: Process files synchronously in memory during the upload request. This simplifies the flow, eliminates filesystem dependencies for processing, and allows immediate return of results (like image analysis) to the frontend.
   - Provide immediate UI feedback during uploads (e.g., animated indicator) and display results directly upon completion.

7. **Frontend State Management & Rendering**
   - Overly simplistic history fetching/re-rendering can lead to lost context or incorrect message displays (e.g., wiping user's latest message, not showing latest AI response).
   - Solution: Refine frontend logic to handle API responses directly (like displaying analysis from upload response) rather than relying solely on delayed history fetches for critical updates. Ensure rendering logic correctly handles the sequence and content of messages.

8. **Scope Issues in JavaScript**
   - Helper functions defined within one scope (e.g., `DOMContentLoaded`) may not be accessible from other scopes (e.g., `setTimeout` callbacks) leading to `ReferenceError`.
   - Solution: Define helper functions in a broader scope or explicitly pass needed variables/references, or attach functions to the `window` object if global access is intended.

## Next Steps

1. **Complete Milvus Integration**
   - Install and configure Milvus Docker container
   - Implement actual client connection to Milvus
   - Add collection and partition management for user vectors
   - Optimize vector storage for performance and scalability

2. **Complete Graph Database Integration**
   - Install and configure Neo4j for the knowledge graph
   - Implement APIs to convert data to Cypher queries
   - Develop endpoints for graph queries and updates
   - Create comprehensive node and relationship types to model the user's world:
     - Person, Trait, Interest, Value, Event, Emotion, Action, Challenge, System
     - Relationships: HAS_TRAIT, PURSUES_INTEREST, MOTIVATED_BY, EXPERIENCED_EVENT, etc.

3. **Interaction to Knowledge Graph AI Pipeline**
   - Develop "Extraction, Segmentation & Graph Mapping AI" agent
   - Implement system prompts for entity recognition and relationship extraction
   - Build embedding generation for semantic meaning representation
   - Create Neo4j node/relationship creation from AI analysis
   - Implement clarification workflow for ambiguous information

4. **3D Visualization Components**
   - Implement vector space visualization using Three.js
   - Develop knowledge graph 3D visualization using react-force-graph-3d
   - Create interactive UI controls to switch between visualization modes
   - Implement real-time updates as new thoughts/nodes are created

## Technical Debt

1. **Environment Variables**
   - JWT_SECRET is currently hardcoded in the .env file
   - Should be generated securely and managed via a secrets management system

2. **Error Handling**
   - Current error handling is basic and should be enhanced
   - Need to implement a more standardized error response format

3. **Input Validation**
   - More comprehensive validation needed for all API inputs
   - Consider using a validation library like Joi or express-validator

4. **Test Coverage**
   - Current tests are functional but not comprehensive
   - Need unit tests in addition to integration tests
   - Should implement automated testing with a framework like Jest

5. **Database Transactions**
   - Need to implement proper database transactions for operations affecting multiple tables

6. **Security**
   - Need to implement rate limiting to prevent abuse
   - Should add CSRF protection for production
   - Password policy enforcement should be improved

7. **Image and Document Processing**
   - Basic text extraction for PDF, DOCX, MD, TXT implemented.
   - Basic image description via Gemini implemented.
   - Consider adding OCR capabilities for text extraction from images.
   - Need robust error handling for file parsing/analysis failures within `fileProcessor.js`.
   - Vector embeddings for file content are currently triggered asynchronously from the upload route, but the status isn't tracked back to the original interaction record reliably yet.

## Technical Architecture - Knowledge Graph Pipeline

### Overview
The Knowledge Graph Pipeline extracts meaningful information from user interactions and builds a rich representation of the user's world in both vector space (for semantic similarity) and graph space (for relationships between entities).

### Key Components

1. **Interaction to Thought Extraction**
   - **Input**: Raw user interactions (text, uploaded documents, images)
   - **Process**: AI agent analyzes content to extract meaningful, standalone statements
   - **Output**: Multiple "Thought" records in PostgreSQL, each with text and vector embedding

2. **Thought to Knowledge Graph Mapping**
   - **Input**: Extracted thoughts with entity and relationship information
   - **Process**: Graph mapping service converts to Neo4j Cypher queries
   - **Output**: Rich knowledge graph with typed nodes and relationships

3. **Visualization Layer**
   - **Vector Space View**: 3D interactive visualization of thought embeddings
   - **Graph View**: 3D interactive visualization of the knowledge graph
   - **Chat History View**: Traditional text-based interaction history

### Data Flow

1. User provides input via chat, upload, or voice
2. Input is saved as an Interaction record
3. Background process analyzes the interaction content
4. AI extracts meaningful statements, identifies entities/relationships
5. Thoughts are created with vector embeddings
6. Neo4j graph is updated with new nodes/relationships
7. Vector space and graph visualizations are updated in real-time

### AI Agent Responsibilities

The "Extraction, Segmentation & Graph Mapping" Agent:
- Segments user inputs into discrete, meaningful statements
- Identifies the primary subject of each statement
- Recognizes entities that match graph node types
- Extracts relationships between entities
- Flags ambiguous statements for user clarification
- Generates vector embeddings for semantic searching

## Recent Updates

### Voice Recognition Improvements
- Implemented browser-based speech recognition using the Web Speech API
- Removed OpenAI dependency for audio transcription
- Added robust error handling for microphone access, permissions, and browser support
- Transcribed text appears directly in the chat input field for easy editing before sending
- All speech recognition happens client-side for better privacy and reduced API costs

### Chat Interface Improvements
- Added file/image upload capabilities to the chat interface
- Implemented voice-to-text functionality for audio input
- All attachments (files, images, audio recordings) are now captured in the interactions table
- Enhanced the message display to show image previews and file details

### Prompt Engineering Framework
A comprehensive prompt engineering framework has been added to improve Dot's responses:
- Created a structured JSON configuration in `prompts/dot-prompts.json`
- Added detailed system prompts that explain 2Dots1Line's purpose and capabilities
- Included few-shot examples for common user inquiries
- Implemented dos and don'ts guidelines for response style
- Customized approaches for different user scenarios (brainstorming, decision-making, reflection)

### Fixed Authentication Issues
- Resolved a critical mismatch between `sessionStorage` and `localStorage` usage
- Chat authentication now correctly retrieves token from `sessionStorage` to match the login process
- Added more robust error handling for authentication failures

### File Processing Integration
- Backend can now read PDF, DOCX, MD, and TXT files uploaded by users.
- Images uploaded are sent to Gemini for analysis.
- Extracted text and image descriptions are vectorized for semantic memory.
- Fixed interaction logging to capture full chat history including AI responses.

### Synchronous File Processing
- Refactored file uploads to use memory storage and process content (text extraction, image analysis via Gemini) immediately upon upload.
- Analysis results are now returned directly to the frontend, improving responsiveness.
- Eliminated complex asynchronous processing flow for initial file analysis, resolving filesystem access issues.
- Updated chat UI to correctly display analysis results and show an animated processing indicator.

## Knowledge Graph Implementation

### Overview
We've implemented a knowledge graph service that extracts entities and relationships from text and stores them in a Neo4j graph database. This allows the application to build a semantic network of knowledge that can be queried and visualized.

### Components
- **Neo4j Service** - Handles direct interactions with the Neo4j graph database
- **Knowledge Graph Service** - Orchestrates knowledge extraction using Google's Generative AI and storage in Neo4j
- **API Routes** - Endpoints for extracting, querying, and managing knowledge

### Testing
We created several test scripts to validate the functionality:
- `test-knowledge-graph.js` - End-to-end test of the knowledge graph functionality (requires Neo4j)
- `test-knowledge-extraction.js` - Tests only the knowledge extraction component (requires Gemini API)
- `test-knowledge-extraction-mock.js` - Uses mock data to test the knowledge extraction process (no external dependencies)

### Technical Implementation
- Neo4j database is used to store entities and relationships
- Google's Generative AI (Gemini) is used to extract knowledge from text
- Each entity and relationship is tagged with metadata including source, confidence, and timestamps
- REST API for knowledge graph operations

### Setup Requirements
- Neo4j database (local or remote)
- Valid Google Gemini API key
- Environment variables configured in `.env` file

### Lessons Learned
- The knowledge extraction quality heavily depends on the prompts and AI model capability
- Neo4j provides an excellent foundation for knowledge graphs with its graph database capabilities
- Proper metadata tagging is crucial for tracking provenance of knowledge
- Error handling is essential for reliable knowledge extraction

### Next Steps
- Implement visualization of the knowledge graph
- Add more advanced querying capabilities
- Integrate with the chat interface for real-time knowledge extraction
- Add support for multi-hop reasoning across the knowledge graph
- Implement entity disambiguation and reference resolution

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- PostgreSQL (v13 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd 2dots1line
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     DATABASE_URL="postgresql://<username>@localhost:5432/2dots1line?schema=public"
     PORT=3001
     JWT_SECRET=<your-secret-key>
     ```

4. Run database migrations:
   ```
   npx prisma migrate dev
   ```

5. Start the development server:
   ```
   npm run dev
   ```

### Running Tests

- To test the User Management APIs:
  ```
  node test-user-api.js
  ```

- To test the Authentication APIs:
  ```
  node test-auth-api.js
  ```

- To test the Interaction Management APIs:
  ```
  node test-interaction-api.js
  ```

- To test the Vector API functionality:
  ```
  node test-vector-api.js
  ```

## Troubleshooting

### Common Issues

#### Port Already in Use (EADDRINUSE)
If you see an error like `Error: listen EADDRINUSE: address already in use :::3001`:

1. Find the process using the port:
   ```
   lsof -i :3001
   ```
   
2. Kill the process:
   ```
   kill -9 <PID>
   ```
   
3. Alternatively, change the port in your .env file:
   ```
   PORT=3002
   ```

#### OpenAI API Key Errors
If you see `OpenAIError: The OPENAI_API_KEY environment variable is missing or empty`:

1. We've removed OpenAI dependencies. If you're seeing this error, check:
   - Make sure you're running the latest version of the code
   - The error might be coming from an outdated .env file with OpenAI references
   
2. Run `grep -r "openai" --include="*.js" .` to find any remaining OpenAI references in the code

#### Database Connection Issues
If you're having trouble connecting to the database:

1. Verify your PostgreSQL service is running:
   ```
   pg_isready
   ```
   
2. Check your DATABASE_URL in the .env file:
   - Ensure the username, password, and database name are correct
   - Make sure the database exists: `createdb 2dots1line` if needed

#### File Uploads Not Working
If file uploads are failing:

1. Ensure the uploads directory is writable:
   ```
   chmod -R 755 uploads
   ```
   
2. Check that the maximum file size isn't being exceeded (default is 10MB)

## License

[MIT](https://choosealicense.com/licenses/mit/)

### Running the Application

Follow these steps to get the development environment running:

1.  **Start PostgreSQL Database:**
    *   Ensure your PostgreSQL server is running. The command to start it depends on your installation method (e.g., `brew services start postgresql` on macOS with Homebrew, `systemctl start postgresql` on Linux).
    *   Verify it's running using: `pg_isready`

2.  **Run Database Migrations:**
    *   Apply any pending database schema changes:
        ```bash
        npx prisma migrate dev
        ```
    *   This command will also generate the Prisma Client if needed.

3.  **Start the Backend Server:**
    *   Run the Node.js/Express server with `nodemon` for automatic restarts on file changes:
        ```bash
        npm run dev
        ```
    *   The server will typically run on the port specified in your `.env` file (default: 3001).

4.  **(Optional) Start Prisma Studio:**
    *   To visually inspect and manage your database, open a *new terminal window* and run:
        ```bash
        npx prisma studio
        ```
    *   This will open a GUI in your web browser (usually at `http://localhost:5555`).

### Stopping and Restarting

*   **Backend Server (nodemon):**
    *   **Stop:** Press `Ctrl + C` in the terminal where `npm run dev` is running.
    *   **Restart:** Simply stop and start it again (`Ctrl + C`, then `npm run dev`). Nodemon usually handles restarts automatically if you save code changes.
*   **Prisma Studio:**
    *   **Stop:** Press `Ctrl + C` in the terminal where `npx prisma studio` is running.
    *   **Restart:** Run `npx prisma studio` again in a terminal.
*   **PostgreSQL Server:**
    *   **Stop/Restart:** Use the appropriate command for your system (e.g., `brew services stop/restart postgresql`, `systemctl stop/restart postgresql`). 

## Memory Layer Enhancements

Based on the comprehensive memory layer design (see `MemoryLayerDesign-Organized.md`), the following enhancements are needed to the current system:

### Data Schema Improvements

1. **Raw Data Table**
   - Add `perspective_owner_id` and `subject_id` fields to track who narrated the data and whom it's about
   - This enables multi-perspective modeling (e.g., user talking about their child)

2. **Embedding Metadata Enhancement**
   - Expand vector embeddings with richer metadata:
     - Importance score
     - Source IDs for tracking provenance
     - Linked knowledge graph node IDs
     - Subject and perspective information

3. **Knowledge Graph Schema Expansion**
   - Enrich the node types beyond basic entities (Person, Organization, etc.)
   - Add specialized node types: Event, Emotion, Trait, Value, Goal, Challenge
   - Implement meaningful relationship types like PARTICIPATED_IN, FELT_DURING, HAS_TRAIT
   - Add perspective and subject metadata to all nodes

### Processing Pipeline Improvements

1. **Semantic Chunking**
   - Replace simple text splitting with semantically-aware chunking
   - Implement overlapping windows to maintain context
   - Add semantic boundary detection for coherent chunks

2. **Importance Filtering**
   - Add two-stage filtering:
     - Coarse filtering based on rules and keywords
     - Fine filtering using AI-based importance scoring
   - Only process and store truly valuable information

3. **Incremental Embedding Updates**
   - Add similarity checking before creating new embeddings
   - Implement weighted updates for existing embeddings
   - Use confidence scores to prioritize higher-quality information

4. **Knowledge Graph First Approach**
   - Generate knowledge graph structures before embeddings
   - Base embeddings on both raw content and graph context
   - Ensure proper linking between embeddings and graph nodes

5. **Dynamic Ontology Evolution**
   - Implement monitoring for new entity/relationship patterns
   - Add capability to propose new node/edge types based on data
   - Create migration tools for evolving the schema

### Implementation Priorities

1. **Phase 1: Foundation (High Priority)**
   - Enhance `thoughtService.js` with improved semantic extraction
   - Update knowledge extraction prompt in `knowledgeExtractionService.js`
   - Modify database schema to support multi-perspective modeling

2. **Phase 2: Processing Pipeline (Medium Priority)**
   - Implement semantic chunking for uploaded documents
   - Add importance filtering to reduce noise
   - Create incremental embedding update mechanism

3. **Phase 3: Advanced Features (Lower Priority)**
   - Build dynamic ontology expansion capability
   - Develop visualization tools for the knowledge graph
   - Implement cross-database entity linking

### Next Steps

1. Update `thoughtService.js` with the enhanced extraction prompt that focuses on user information
2. Enhance `knowledgeExtractionService.js` with richer entity and relationship types
3. Update Prisma schema to add perspective and subject tracking
4. Create tests for the enhanced memory processing pipeline
5. Implement specialized visualization for the knowledge graph structure

    I see your observations about the current knowledge extraction implementation. Let's address both issues and provide some practical improvements.

## 1. Improving Thought Vectorization

You're absolutely right - the current approach seems to capture too many trivial statements and AI acknowledgements rather than focusing on meaningful user information.

### Industry Best Practices for Vectorization:

1. **Semantic chunking over arbitrary chunking**: Instead of breaking text by arbitrary length, break it into semantically coherent units.

2. **Hierarchical representation**: Store information at multiple levels of granularity (concepts → facts → details).

3. **Deduplication with semantic merging**: Rather than exact deduplication, merge similar concepts with their nuances preserved.

4. **Progressive refinement**: Start with broad concepts and refine them as more information comes in.

5. **User-centric modeling**: Focus on information that builds the user's model, not the conversation itself.

### The Thought Extraction Prompt Location:

The main prompt for thought extraction is in `services/thoughtService.js`. Here's what to modify:

Read file: services/thoughtService.js
### Improved Thought Extraction Prompt:

Let's enhance the prompt to focus on user information, synthesize content, and avoid AI acknowledgments:

```javascript:services/thoughtService.js
// ... existing code ...
async function extractThoughtsFromMessage(message, interactionId, userId) {
  try {
    console.log(`[INFO] Extracting thoughts from message: "${message.substring(0, 50)}..."`);
    
    // Use Gemini to extract meaningful thoughts from the message
    const result = await model.generateContent(`
      Analyze the following message and extract or synthesize high-value knowledge about the user's world, experiences, goals, and relationships.
      
      Important Guidelines:
      1. FOCUS ONLY ON USER INFORMATION - Ignore AI responses or acknowledgments entirely
      2. SYNTHESIZE rather than extract - Generate meaningful, substantive insights rather than simple statements
      3. COMBINE related information - Create coherent thoughts that merge multiple related points
      4. PRIORITIZE NEW INFORMATION - Only capture what adds to our understanding of the user's world
      5. IGNORE conversational elements, greetings, or generic statements
      6. AVOID capturing opinions or statements made by the AI assistant
      
      ONLY focus on:
      - Facts about the user's life, experiences, history, or environment
      - User's preferences, values, opinions, and personality traits
      - User's relationships with people, places, or things
      - User's goals, plans, aspirations, and motivations
      - Significant concepts, entities, or domains relevant to the user
      
      For each thought, provide:
      1. A synthesized, complete statement representing the insight (aim for depth and substance)
      2. A concise, descriptive title (3-5 words)
      3. The subject type (user_trait, user_experience, user_preference, user_relationship, user_goal, entity, concept)
      4. The subject name (the specific trait, person, concept, etc.)
      5. A confidence score (0.0-1.0) indicating how certain you are of this insight
      
      Format your response as a JSON array of thought objects:
      [
        {
          "title": "Descriptive Title",
          "content": "A substantial, synthesized statement representing meaningful knowledge about the user",
          "subjectType": "user_trait|user_experience|user_preference|user_relationship|user_goal|entity|concept",
          "subjectName": "specific name of trait, person, concept, etc.",
          "confidence": 0.9
        }
      ]
      
      MESSAGE: ${message}
    `);
    
    // Parse the generated content to extract the JSON
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.log('[INFO] No meaningful thoughts extracted from the message');
      return [];
    }
    
    // Parse the JSON 
    const thoughts = JSON.parse(jsonMatch[0]);
    
    // Filter out low-confidence thoughts
    const highConfidenceThoughts = thoughts.filter(thought => thought.confidence >= 0.7);
    
    // Check for similar existing thoughts before creating new ones
    const deduplicatedThoughts = await deduplicateThoughts(highConfidenceThoughts, userId);
    
    // Generate embeddings for each thought
    const thoughtsWithEmbeddings = await Promise.all(
      deduplicatedThoughts.map(async (thought) => {
        const embedding = await generateEmbedding(thought.content);
        return {
          ...thought,
          embedding,
          interactionId,
          userId
        };
      })
    );
    
    return thoughtsWithEmbeddings;
  } catch (error) {
    console.error('[ERROR] Failed to extract thoughts from message:', error);
    throw error;
  }
}

/**
 * Check for existing similar thoughts and deduplicate new thoughts
 * @param {Array} newThoughts - Array of new thoughts to check
 * @param {string} userId - User ID to check against
 * @returns {Promise<Array>} - Array of deduplicated thoughts
 */
async function deduplicateThoughts(newThoughts, userId) {
  const uniqueThoughts = [];
  
  for (const thought of newThoughts) {
    // Check if similar thought exists by subject name and type
    const existingThoughts = await prisma.thought.findMany({
      where: {
        userId: userId,
        subjectName: thought.subjectName,
        subjectType: thought.subjectType
      }
    });
    
    if (existingThoughts.length === 0) {
      // No similar thought exists, add this one
      uniqueThoughts.push(thought);
    } else {
      // Check for semantic similarity to avoid near-duplicates
      let isDuplicate = false;
      
      for (const existing of existingThoughts) {
        // If the titles are very similar, consider it a duplicate
        if (stringSimilarity(existing.title, thought.title) > 0.7) {
          isDuplicate = true;
          break;
        }
        
        // If the content is very similar, consider it a duplicate
        if (stringSimilarity(existing.content, thought.content) > 0.7) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        uniqueThoughts.push(thought);
      }
    }
  }
  
  return uniqueThoughts;
}

/**
 * Calculate string similarity score between two strings (0-1)
 * Simple implementation of Jaccard similarity using word sets
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function stringSimilarity(str1, str2) {
  // Convert strings to lowercase and split into words
  const words1 = new Set(str1.toLowerCase().split(/\W+/).filter(word => word.length > 0));
  const words2 = new Set(str2.toLowerCase().split(/\W+/).filter(word => word.length > 0));
  
  // Calculate intersection
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  
  // Calculate union
  const union = new Set([...words1, ...words2]);
  
  // Calculate Jaccard similarity
  return intersection.size / union.size;
}

// ... existing code ...
```
Now we need to update other parts of the service to account for the changes, specifically the `processInteractionForThoughts` function that creates the thoughts in the database:

```javascript:services/thoughtService.js
// ... existing code ...
const createdThoughts = await Promise.all(
  thoughtsWithEmbeddings.map(async (thought) => {
    return await prisma.thought.create({
      data: {
        userId: thought.userId,
        interactionId: thought.interactionId,
        title: thought.title,
        content: thought.content,
        embedding: thought.embedding,
        subjectType: thought.subjectType,
        subjectName: thought.subjectName,
        confidence: thought.confidence || 1.0  // Add confidence field with default
      }
    });
  })
);
// ... existing code ...

module.exports = {
  extractThoughtsFromMessage,
  generateEmbedding,
  processInteractionForThoughts,
  batchProcessInteractionsForThoughts,
  deduplicateThoughts  // Export the new function
};
```
Now we need to update the Prisma schema to include the confidence field:

```plain text:prisma/schema.prisma
// ... existing code ...
model Thought {
  id            String    @id @default(uuid()) @db.Uuid
  interactionId String    @db.Uuid // Foreign key to Interaction
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  userId        String    @db.Uuid
  title         String?
  content       String    // The specific text segment for this thought
  embedding     Float[]   // Vector embedding for the content
  subjectType   String?   // e.g., 'user_trait', 'user_experience', 'entity'
  subjectName   String?   // e.g., name if subjectType is 'entity'
  confidence    Float     @default(1.0) // Confidence score for the thought (0.0-1.0)
  user          User      @relation(fields: [userId], references: [user_id])
  interaction   Interaction @relation(fields: [interactionId], references: [interaction_id]) // Relation back to the source Interaction
}
// ... existing code ...
```
## 2. Improving Neo4j Knowledge Graph Structure

Let's look at your example files to understand your preferred structure for nodes and edges:

Read file: /Users/danniwang/Documents/GitHub/2dots1line/Old/20250408New/Reference/UserPersona/choudan_relationships_final_fixed.cypher
Now that I understand your preferred knowledge graph structure, let's update the Neo4j knowledge graph service to use more meaningful node types and relationships:

Read file: services/knowledgeGraphService.js
Let's update the knowledge graph extraction with a more meaningful structure:

```javascript:services/knowledgeGraphService.js
/**
 * Extract knowledge (entities and relationships) from a text message
 * @param {string} message - The message to extract knowledge from
 * @returns {Promise<Object>} Extracted entities and relationships
 */
async function extractKnowledge(message) {
  try {
    // Structured prompt for knowledge extraction with domain-specific schema
    const prompt = `
    Analyze the following text and extract meaningful entities and relationships for a user-focused knowledge graph.
    
    Use the following SCHEMA:
    
    NODE TYPES:
    - Person: People mentioned by name (including the user)
    - Trait: Character traits, personality attributes
    - Interest: Hobbies, activities, topics of interest
    - Value: Personal values, principles, beliefs
    - Event: Specific occurrences, happenings
    - Emotion: Feelings, emotional states
    - Action: Things done or to be done
    - Challenge: Problems, difficulties, obstacles
    - Location: Places, geographic entities
    - Organization: Companies, institutions, groups
    - Concept: Abstract ideas, theories
    - Goal: Objectives, aspirations
    - System: Contexts, environments (e.g., family system)
    
    RELATIONSHIP TYPES:
    - HAS_TRAIT: Links Person to Trait
    - PURSUES_INTEREST: Links Person to Interest
    - MOTIVATED_BY: Links Person/Action to Value
    - EXPERIENCED_EVENT: Links Person to Event
    - REACTED_WITH: Links Event to Emotion
    - TOOK_ACTION: Links Person to Action
    - GUIDED_BY: Links Action to Value/Goal
    - FACES_CHALLENGE: Links Person to Challenge
    - EMBEDS_INTO: Links Person to System
    - WORKS_AT: Links Person to Organization
    - LOCATED_IN: Links Person to Location
    - KNOWS: Links Person to Person
    - HAS_AFFECTION_FOR: Links Person to Person/Thing
    - INVOLVED_IN: Links Person to Event/Action
    - GIVEN_TO: Links Trait/Emotion to Person
    - OFFERED: Links Person to Service/Thing
    - HAS_RELATIONSHIP_WITH: Links Person to Person
    - REQUIRED_FOR: Links Interest/Skill to Goal
    - HAS_PET: Links Person to Pet
    
    Only extract entities and relationships that are explicitly mentioned or can be reasonably inferred from the text.
    Format the output as JSON with "entities" and "relationships" arrays.
    Include a confidence score (0.0-1.0) for each extraction.
    
    For entities, include:
    - name: The entity name (specific, not generic)
    - category: One of the node types listed above
    - confidence: How certain you are of this entity (0.0-1.0)
    - properties: Additional properties relevant to this entity type
    
    For relationships, include:
    - source: Name of the source entity (must match an entity name)
    - target: Name of the target entity (must match an entity name)
    - type: One of the relationship types listed above
    - confidence: How certain you are of this relationship (0.0-1.0)
    
    Text: "${message}"
    
    Response format:
    {
      "entities": [
        {"name": "entity_name", "category": "NODE_TYPE", "confidence": 0.9, "properties": {"key": "value"}},
        ...
      ],
      "relationships": [
        {"source": "source_entity", "target": "target_entity", "type": "RELATIONSHIP_TYPE", "confidence": 0.8},
        ...
      ]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/{[\s\S]*}/) ||
                      text.match(/\{[\s\S]*\}/);
                      
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }
    
    // Parse the extracted JSON
    let jsonStr = jsonMatch[0];
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonMatch[1];
    }
    
    const extractedData = JSON.parse(jsonStr);
    
    // Filter out low-confidence extractions
    const entities = (extractedData.entities || [])
      .filter(entity => entity.confidence === undefined || entity.confidence >= 0.7);
    
    const relationships = (extractedData.relationships || [])
      .filter(rel => rel.confidence === undefined || rel.confidence >= 0.7);
    
    // Validate that relationship entities exist
    const validRelationships = relationships.filter(rel => {
      const sourceExists = entities.some(e => e.name === rel.source);
      const targetExists = entities.some(e => e.name === rel.target);
      return sourceExists && targetExists;
    });
    
    return {
      entities: entities,
      relationships: validRelationships
    };
  } catch (error) {
    console.error('Knowledge extraction error:', error);
    // Return empty results on error
    return { entities: [], relationships: [] };
  }
}
```
Now, let's update the Neo4j service to handle entity properties and provide a way for direct control over nodes and edges:

Read file: services/neo4jService.js
Let's update the Neo4j service to use specific node labels based on the category, rather than using a generic "Entity" label with a category property:

```javascript:services/neo4jService.js
/**
 * Create an entity node in Neo4j
 * @param {string} name - Entity name
 * @param {string} category - Entity category (becomes the node label)
 * @param {Object} properties - Additional properties
 * @returns {Promise<Object>} Created entity
 */
async function createEntity(name, category, properties = {}) {
  if (!name || !category) {
    throw new Error('Entity name and category are required');
  }
  
  // Clean up the category name to ensure it's a valid Neo4j label
  const nodeLabel = category.trim().replace(/\s+/g, '');
  
  const session = getSession();
  try {
    const result = await session.executeWrite(tx => {
      return tx.run(
        `
        MERGE (e:${nodeLabel} {name: $name})
        ON CREATE SET e.createdAt = datetime()
        SET e += $properties
        RETURN e
        `,
        { name, properties }
      );
    });
    
    if (result.records.length === 0) {
      throw new Error(`Failed to create ${nodeLabel} entity: ${name}`);
    }
    
    return {
      ...result.records[0].get('e').properties,
      category: nodeLabel
    };
  } catch (error) {
    console.error(`Error creating ${nodeLabel} entity:`, error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Create a relationship between two entities
 * @param {string} sourceName - Source entity name
 * @param {string} targetName - Target entity name
 * @param {string} type - Relationship type
 * @param {Object} properties - Additional properties
 * @returns {Promise<Object>} Created relationship
 */
async function createRelationship(sourceName, targetName, type, properties = {}) {
  if (!sourceName || !targetName || !type) {
    throw new Error('Source entity, target entity, and relationship type are required');
  }
  
  const session = getSession();
  try {
    // First try to find the source and target nodes with any label
    const result = await session.executeWrite(tx => {
      return tx.run(
        `
        MATCH (source {name: $sourceName})
        MATCH (target {name: $targetName})
        MERGE (source)-[r:${type}]->(target)
        ON CREATE SET r.createdAt = datetime()
        SET r += $properties
        RETURN source, r, target, labels(source) as sourceLabels, labels(target) as targetLabels
        `,
        { sourceName, targetName, properties }
      );
    });
    
    if (result.records.length === 0) {
      throw new Error(`Failed to create relationship from ${sourceName} to ${targetName}`);
    }
    
    return {
      source: {
        ...result.records[0].get('source').properties,
        labels: result.records[0].get('sourceLabels')
      },
      relationship: {
        type: type,
        ...result.records[0].get('r').properties
      },
      target: {
        ...result.records[0].get('target').properties,
        labels: result.records[0].get('targetLabels')
      }
    };
  } catch (error) {
    console.error(`Error creating relationship from ${sourceName} to ${targetName}:`, error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Query entities by name (with fuzzy matching)
 * @param {string} namePattern - Name pattern to search for
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Matching entities
 */
async function queryEntitiesByName(namePattern, limit = 10) {
  const session = getSession();
  try {
    const result = await session.executeRead(tx => {
      return tx.run(
        `
        MATCH (e)
        WHERE e.name CONTAINS $namePattern
        RETURN e, labels(e) as labels
        LIMIT $limit
        `,
        { namePattern, limit: neo4j.int(limit) }
      );
    });
    
    return result.records.map(record => ({
      ...record.get('e').properties,
      labels: record.get('labels')
    }));
  } finally {
    await session.close();
  }
}

/**
 * Get neighborhood of an entity
 * @param {string} entityName - Name of the entity
 * @param {number} depth - Depth of neighborhood exploration
 * @returns {Promise<Object>} Entity neighborhood data
 */
async function getEntityNeighborhood(entityName, depth = 1) {
  const session = getSession();
  try {
    const result = await session.executeRead(tx => {
      return tx.run(
        `
        MATCH (e {name: $entityName})
        OPTIONAL MATCH path = (e)-[r*1..${depth}]-(connected)
        RETURN e AS entity, 
               labels(e) as entityLabels,
               collect(DISTINCT connected) AS connected, 
               collect(DISTINCT labels(connected)) AS connectedLabels,
               collect(DISTINCT r) AS relationships
        `,
        { entityName }
      );
    });
    
    if (result.records.length === 0) {
      return { entity: null, connections: [] };
    }
    
    const record = result.records[0];
    const entity = {
      ...record.get('entity').properties,
      labels: record.get('entityLabels')
    };
    
    const connected = record.get('connected');
    const connectedLabels = record.get('connectedLabels');
    
    const connections = connected.map((node, index) => ({
      ...node.properties,
      labels: connectedLabels[index]
    }));
    
    const relationships = record.get('relationships').flat().map(rel => ({
      type: rel.type,
      properties: rel.properties
    }));
    
    return {
      entity,
      connections,
      relationships
    };
  } finally {
    await session.close();
  }
}

/**
 * Delete entities and relationships by interactionId
 * @param {string} interactionId - ID of the interaction to delete
 * @returns {Promise<Object>} Results of the deletion
 */
async function deleteByInteractionId(interactionId) {
  const session = getSession();
  try {
    const result = await session.executeWrite(tx => {
      return tx.run(
        `
        MATCH (n)
        WHERE n.sourceInteractionId = $interactionId
        DETACH DELETE n
        RETURN count(n) AS deletedCount
        `,
        { interactionId }
      );
    });
    
    return {
      deletedCount: result.records[0].get('deletedCount').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * Create a custom entity node directly
 * @param {string} label - The entity label (node type)
 * @param {string} name - Entity name
 * @param {Object} properties - Additional properties
 * @returns {Promise<Object>} Created entity
 */
async function createCustomEntity(label, name, properties = {}) {
  if (!name || !label) {
    throw new Error('Entity name and label are required');
  }
  
  const session = getSession();
  try {
    const result = await session.executeWrite(tx => {
      return tx.run(
        `
        MERGE (e:${label} {name: $name})
        ON CREATE SET e.createdAt = datetime()
        SET e += $properties
        RETURN e, labels(e) as labels
        `,
        { name, properties }
      );
    });
    
    if (result.records.length === 0) {
      throw new Error(`Failed to create ${label} entity: ${name}`);
    }
    
    return {
      ...result.records[0].get('e').properties,
      labels: result.records[0].get('labels')
    };
  } finally {
    await session.close();
  }
}

/**
 * Create a custom relationship with a specific type
 * @param {string} sourceName - Source entity name 
 * @param {string} targetName - Target entity name
 * @param {string} type - Relationship type
 * @param {Object} properties - Additional properties
 * @returns {Promise<Object>} Created relationship
 */
async function createCustomRelationship(sourceName, targetName, type, properties = {}) {
  if (!sourceName || !targetName || !type) {
    throw new Error('Source name, target name, and relationship type are required');
  }
  
  const session = getSession();
  try {
    const result = await session.executeWrite(tx => {
      return tx.run(
        `
        MATCH (source {name: $sourceName})
        MATCH (target {name: $targetName})
        MERGE (source)-[r:${type}]->(target)
        ON CREATE SET r.createdAt = datetime(), r.manuallyCreated = true
        SET r += $properties
        RETURN source, r, target, labels(source) as sourceLabels, labels(target) as targetLabels
        `,
        { sourceName, targetName, properties }
      );
    });
    
    if (result.records.length === 0) {
      throw new Error(`Failed to create relationship from ${sourceName} to ${targetName}`);
    }
    
    return {
      source: {
        ...result.records[0].get('source').properties,
        labels: result.records[0].get('sourceLabels')
      },
      relationship: {
        type: type,
        ...result.records[0].get('r').properties
      },
      target: {
        ...result.records[0].get('target').properties,
        labels: result.records[0].get('targetLabels')
      }
    };
  } finally {
    await session.close();
  }
}

module.exports = {
  init,
  close,
  createEntity,
  createRelationship,
  queryEntitiesByName,
  getEntityNeighborhood,
  deleteByInteractionId,
  createCustomEntity,
  createCustomRelationship
};
```
Now let's create a simple interface in the form of routes for manually adding custom nodes and relationships:

```javascript:routes/knowledgeGraphRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const knowledgeGraphService = require('../services/knowledgeGraphService');
const neo4jService = require('../services/neo4jService');

// All routes require authentication
router.use(authMiddleware.verifyToken);

/**
 * Process a message for knowledge extraction
 * POST /api/knowledge/process
 */
router.post('/process', async (req, res) => {
  try {
    const { message, interactionId } = req.body;
    const userId = req.user.user_id;
    
    if (!message || !interactionId) {
      return res.status(400).json({ error: 'Message and interactionId are required' });
    }
    
    const result = await knowledgeGraphService.processMessageForKnowledge(
      message,
      interactionId,
      userId
    );
    
    res.status(200).json({
      message: 'Knowledge extraction completed successfully',
      result
    });
  } catch (error) {
    console.error('Error processing knowledge:', error);
    res.status(500).json({ error: 'Failed to process knowledge' });
  }
});

/**
 * Delete knowledge associated with an interaction
 * DELETE /api/knowledge/interaction/:id
 */
router.delete('/interaction/:id', async (req, res) => {
  try {
    const interactionId = req.params.id;
    
    const result = await knowledgeGraphService.deleteKnowledgeByInteractionId(interactionId);
    
    if (result.success) {
      res.status(200).json({
        message: `Successfully deleted ${result.deletedCount} knowledge items`,
        result
      });
    } else {
      res.status(500).json({
        message: 'Failed to delete knowledge',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    res.status(500).json({ error: 'Failed to delete knowledge' });
  }
});

/**
 * Search for entities by name
 * GET /api/knowledge/entities
 */
router.get('/entities', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const entities = await knowledgeGraphService.queryEntitiesByName(
      query,
      parseInt(limit)
    );
    
    res.status(200).json({
      count: entities.length,
      entities
    });
  } catch (error) {
    console.error('Error querying entities:', error);
    res.status(500).json({ error: 'Failed to query entities' });
  }
});

/**
 * Get neighborhood of an entity
 * GET /api/knowledge/neighborhood/:name
 */
router.get('/neighborhood/:name', async (req, res) => {
  try {
    const entityName = req.params.name;
    const { depth = 1 } = req.query;
    
    const neighborhood = await knowledgeGraphService.getEntityNeighborhood(
      entityName,
      parseInt(depth)
    );
    
    res.status(200).json(neighborhood);
  } catch (error) {
    console.error('Error getting entity neighborhood:', error);
    res.status(500).json({ error: 'Failed to get entity neighborhood' });
  }
});

/**
 * Create a custom entity
 * POST /api/knowledge/entity
 */
router.post('/entity', async (req, res) => {
  try {
    const { name, type, properties = {} } = req.body;
    const userId = req.user.user_id;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Entity name and type are required' });
    }
    
    // Initialize Neo4j connection
    await neo4jService.init();
    
    // Add user ID and timestamp to properties
    const entityProperties = {
      ...properties,
      sourceUserId: userId,
      manuallyCreated: true,
      createdAt: new Date().toISOString()
    };
    
    // Create the entity
    const entity = await neo4jService.createCustomEntity(type, name, entityProperties);
    
    // Close Neo4j connection
    await neo4jService.close();
    
    res.status(201).json({
      message: 'Entity created successfully',
      entity
    });
  } catch (error) {
    console.error('Error creating entity:', error);
    await neo4jService.close();
    res.status(500).json({ error: 'Failed to create entity' });
  }
});

/**
 * Create a custom relationship
 * POST /api/knowledge/relationship
 */
router.post('/relationship', async (req, res) => {
  try {
    const { sourceName, targetName, type, properties = {} } = req.body;
    const userId = req.user.user_id;
    
    if (!sourceName || !targetName || !type) {
      return res.status(400).json({ error: 'Source entity, target entity, and relationship type are required' });
    }
    
    // Initialize Neo4j connection
    await neo4jService.init();
    
    // Add user ID and timestamp to properties
    const relationshipProperties = {
      ...properties,
      sourceUserId: userId,
      manuallyCreated: true,
      createdAt: new Date().toISOString()
    };
    
    // Create the relationship
    const relationship = await neo4jService.createCustomRelationship(
      sourceName,
      targetName,
      type,
      relationshipProperties
    );
    
    // Close Neo4j connection
    await neo4jService.close();
    
    res.status(201).json({
      message: 'Relationship created successfully',
      relationship
    });
  } catch (error) {
    console.error('Error creating relationship:', error);
    await neo4jService.close();
    res.status(500).json({ error: 'Failed to create relationship' });
  }
});

/**
 * Get available node types
 * GET /api/knowledge/types/nodes
 */
router.get('/types/nodes', async (req, res) => {
  // Return the predefined node types
  const nodeTypes = [
    { type: 'Person', description: 'People mentioned by name' },
    { type: 'Trait', description: 'Character traits, personality attributes' },
    { type: 'Interest', description: 'Hobbies, activities, topics of interest' },
    { type: 'Value', description: 'Personal values, principles, beliefs' },
    { type: 'Event', description: 'Specific occurrences, happenings' },
    { type: 'Emotion', description: 'Feelings, emotional states' },
    { type: 'Action', description: 'Things done or to be done' },
    { type: 'Challenge', description: 'Problems, difficulties, obstacles' },
    { type: 'Location', description: 'Places, geographic entities' },
    { type: 'Organization', description: 'Companies, institutions, groups' },
    { type: 'Concept', description: 'Abstract ideas, theories' },
    { type: 'Goal', description: 'Objectives, aspirations' },
    { type: 'System', description: 'Contexts, environments (e.g., family system)' }
  ];
  
  res.status(200).json(nodeTypes);
});

/**
 * Get available relationship types
 * GET /api/knowledge/types/relationships
 */
router.get('/types/relationships', async (req, res) => {
  // Return the predefined relationship types
  const relationshipTypes = [
    { type: 'HAS_TRAIT', description: 'Links Person to Trait' },
    { type: 'PURSUES_INTEREST', description: 'Links Person to Interest' },
    { type: 'MOTIVATED_BY', description: 'Links Person/Action to Value' },
    { type: 'EXPERIENCED_EVENT', description: 'Links Person to Event' },
    { type: 'REACTED_WITH', description: 'Links Event to Emotion' },
    { type: 'TOOK_ACTION', description: 'Links Person to Action' },
    { type: 'GUIDED_BY', description: 'Links Action to Value/Goal' },
    { type: 'FACES_CHALLENGE', description: 'Links Person to Challenge' },
    { type: 'EMBEDS_INTO', description: 'Links Person to System' },
    { type: 'WORKS_AT', description: 'Links Person to Organization' },
    { type: 'LOCATED_IN', description: 'Links Person to Location' },
    { type: 'KNOWS', description: 'Links Person to Person' },
    { type: 'HAS_AFFECTION_FOR', description: 'Links Person to Person/Thing' },
    { type: 'INVOLVED_IN', description: 'Links Person to Event/Action' },
    { type: 'GIVEN_TO', description: 'Links Trait/Emotion to Person' },
    { type: 'OFFERED', description: 'Links Person to Service/Thing' },
    { type: 'HAS_RELATIONSHIP_WITH', description: 'Links Person to Person' },
    { type: 'REQUIRED_FOR', description: 'Links Interest/Skill to Goal' },
    { type: 'HAS_PET', description: 'Links Person to Pet' }
  ];
  
  res.status(200).json(relationshipTypes);
});

module.exports = router;
```
## Summary of Improvements

Here's a summary of the changes we've made:

### 1. Thought Vectorization Improvements:

1. **Enhanced Extraction Logic**:
   - Updated the prompt to focus on user-relevant information
   - Added confidence scoring to filter out low-quality thoughts
   - Implemented deduplication to avoid repetitive thoughts
   - Added subject type categorization for better organization

2. **Schema Updates**:
   - Added a confidence field to the Thought model
   - Defined more specific subject types
   - Added string similarity checking for deduplication

3. **Data Quality**:
   - Focus on synthesized insights rather than simple extraction
   - Filter out AI acknowledgments and conversation filler
   - Organize thoughts by subject type for better retrieval

### 2. Neo4j Knowledge Graph Improvements:

1. **Domain-Specific Schema**:
   - Implemented specific node types (Person, Trait, Interest, etc.)
   - Defined meaningful relationship types (HAS_TRAIT, PURSUES_INTEREST, etc.)
   - Added confidence scoring for relationships too

2. **Neo4j Service Updates**:
   - Updated to use specific labels instead of a generic "Entity" label
   - Added support for properties on both nodes and relationships
   - Improved error handling and logging

3. **Manual Control**:
   - Added routes for manual creation of custom entities
   - Added routes for manual creation of custom relationships 
   - Exposed API endpoints for retrieving available node and relationship types

### Design Principles for Knowledge Graph:

1. **Node Types**: 
   - Use specific, semantically meaningful node types (Person, Trait, Interest, etc.)
   - Capture different aspects of a user's world (people, actions, values, etc.)
   - Allow flexibility with generic types (Concept) for less structured information

2. **Relationship Types**:
   - Relationship types should describe the semantic meaning between nodes
   - Use descriptive names with clear directionality (PURSUES_INTEREST vs. just INTEREST)
   - Group related relationships (HAS_TRAIT, HAS_PET, etc.)

3. **Property Usage**:
   - Use properties for attributes that don't warrant their own nodes
   - Include metadata (source, confidence, timestamp) for provenance
   - Store quantitative attributes as properties (age, confidence score)

4. **Deduplication Strategy**:
   - Merge nodes with the same name and type
   - Use properties to store variations or additional context
   - Track confidence scores to update with higher-quality information

These changes should significantly improve both the Thought extraction process and the knowledge graph structure, making them more useful and meaningful for capturing user information.

# 2Dots1Line Codebase Structure Analysis

## Current Script Dependencies

1. ENTRY POINT
   - src/index.js: Main server entry point, connects to all route modules

2. ROUTES LAYER
   - src/routes/userRoutes.js → User management endpoints
   - src/routes/authRoutes.js → Authentication endpoints
   - src/routes/interactionRoutes.js → User interaction endpoints
   - src/routes/vectorRoutes.js → Vector database operations 
   - src/routes/uploadRoutes.js → File upload handling
   - src/routes/thoughtRoutes.js → Thought extraction endpoints
   - src/routes/knowledgeGraphRoutes.js → Knowledge graph endpoints

3. SERVICES LAYER
   - services/aiService.js → AI interactions service
   - services/embeddingService.js → Vector embedding generation
   - services/knowledgeExtractionService.js → Extract knowledge from text
   - services/knowledgeGraphService.js → Manage graph database
   - services/milvusService.js → Milvus vector DB integration
   - services/neo4jService.js → Neo4j graph DB integration
   - services/thoughtService.js → Extract and process thoughts

4. TEST SCRIPTS
   - test-auth-api.js → Test authentication endpoints
   - test-user-api.js → Test user management endpoints
   - test-interaction-api.js → Test interaction endpoints
   - test-vector-api.js → Test vector operations
   - test-knowledge-extraction.js → Test knowledge extraction
   - test-knowledge-extraction-mock.js → Mock tests for extraction
   - test-thought-process.js → Test thought processing
   - test-thought-extract.js → Test thought extraction
   - test-knowledge-graph.js → Test knowledge graph operations
   - test-ai-interactions.js → Test AI interaction endpoints
   - test-prisma.js → Test database operations

5. UTILITY SCRIPTS
   - check-interactions.js → Check interaction logs
   - check-user.js → Check user information

6. FRONTEND
   - public/index.html → Landing page
   - public/profile.html → User profile page
   - public/NewChat.html → Chat interface
   - public/js/auth.js → Authentication client script
   - public/js/voice-recognition.js → Voice input for chat
   - public/css/* → Style sheets

7. AI CONFIGURATION
   - prompts/dot-prompts.json → AI assistant behavior setup
   

# 2dots1line

## Enhanced Memory Layer

### Overview
The memory layer in 2dots1line has been enhanced to provide a more comprehensive and flexible approach to storing and retrieving user data, thoughts, and insights. The new schema supports:

- Multi-perspective knowledge representation
- Semantic chunking for efficient processing
- Vector embedding storage and retrieval
- Ontology management and evolution
- Historical tracking of changes

### Architecture
The enhanced memory layer consists of the following components:

1. **Raw Data Storage**: Captures original user inputs in their unprocessed form
2. **Semantic Chunking**: Splits larger content into meaningful units for processing
3. **Vector Embeddings**: Stores semantic representations for similarity search
4. **Thought Extraction**: Captures insights derived from user interactions
5. **Ontology Management**: Defines and evolves the knowledge graph schema

### Schema Changes
The database schema has been updated to support these new capabilities:

- Added `RawData`, `SemanticChunk`, `Embedding`, and `EmbeddingUpdate` models
- Enhanced the `Thought` model with additional metadata and relationships
- Added `Perspective` model to support multiple viewpoints
- Added `OntologyVersion`, `NodeType`, `EdgeType`, and `OntologyChangeProposal` models for schema management

### Migration Notes
- Applied migrations: 
  - `20250411181950_enhance_memory_layer`
  - `20250411183000_fix_perspective_user_id`
- Ensured backward compatibility with existing data
- Updated Prisma client to support the new schema

### Technical Debt
- Need to implement the actual vector database integration (currently placeholders in the code)
- Need to update the knowledge graph service to use the new schema
- Need to develop migration tools to move data from the old `Interaction` model to the new `RawData` model

### Next Steps
1. Implement vector database integration using Milvus or Weaviate
2. Enhance the knowledge graph service to use the new schema
3. Develop APIs for managing perspectives and ontology changes
4. Create data migration scripts for legacy data

## Setup

### Prerequisites
- Node.js
- PostgreSQL
- Neo4j (for knowledge graph)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npx prisma migrate dev`
5. Start the server: `npm start`
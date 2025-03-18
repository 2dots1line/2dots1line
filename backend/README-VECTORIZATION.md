# Story Vectorization and LLM Flexibility for 2Dots1Line

This document explains the implementation of story vectorization and flexible LLM model switching in the 2Dots1Line application.

## Overview

The 2Dots1Line application has been enhanced with two key features:

1. **Story Vectorization**: Stories are now vectorized using the `sentence-transformers/all-MiniLM-L6-v2` model for efficient semantic similarity search and enhanced AI analysis.
2. **LLM Provider Flexibility**: The application can now switch between using OpenRouter API and local Ollama models for AI analysis through a structured provider selection mechanism.

## Setup Instructions

### 1. Install Dependencies

Make sure to install the new dependencies:

```bash
cd backend
pip install -r requirements.txt
```

The new dependencies include:
- sentence-transformers (for generating embeddings)
- numpy (for vector operations)
- scikit-learn (for similarity calculations)

### 2. Configure Environment Variables

The `.env` file now includes additional configuration options:

```
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ALLOW_ALL=false

# AI Provider Selection: openrouter or ollama
AI_PROVIDER=openrouter

# OpenRouter Configuration
OPENROUTER_MODEL=deepseek/deepseek-chat

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Sentence Transformer model for embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### 3. Install and Configure Ollama (Optional)

If you want to use local AI models:

1. Install Ollama from [https://ollama.ai/](https://ollama.ai/)
2. Start the Ollama service:
   ```bash
   ollama serve
   ```
3. Pull a model:
   ```bash
   ollama pull llama3
   ```
4. Switch to the Ollama provider using the API:
   ```bash
   curl -X POST http://localhost:8000/config/switch-provider/ollama
   ```

## New API Endpoints

### Configuration Endpoints

- `GET /config` - Get current configuration information
- `GET /config/providers` - Get a list of available providers and their status
- `POST /config/switch-provider/{provider}` - Switch between "openrouter" and "ollama"
- `GET /config/test-ollama` - Test the connection to Ollama server

### Story Processing Endpoints

- `POST /api/stories/tokenize` - Generate embeddings for a single story
- `POST /api/stories/vectorize-all` - Batch process all stories to generate embeddings
- `GET /api/stories/similar/{story_id}` - Find semantically similar stories
- `POST /api/database/upgrade-schema` - Upgrade the database schema to include vectorization fields

## MongoDB Schema Changes

The application now adds the following fields to the `stories` collection:

- `vectorEmbedding`: Array of floating-point values representing the story's vector embedding
- `embeddingModel`: String identifying the model used to create the embedding
- `embeddingUpdatedAt`: Timestamp of when the embedding was last updated
- `analysis`: Object containing the AI analysis of the story:
  - `summary`: Brief summary of the story
  - `strengths`: Array of strengths identified in the story
  - `traits`: Array of traits identified in the story
  - `insights`: Detailed insights from the AI
  - `analyzed_at`: Timestamp of when the analysis was performed
  - `analyzerModel`: Name of the model that performed the analysis

## Testing the Implementation

We've included two testing scripts to verify the functionality:

### 1. Embedding Model Test

Test the embedding model directly:

```bash
cd backend
./test_embedding.py --verbose
```

This script will:
- Load the embedding model
- Generate embeddings for sample texts
- Compute similarity scores between texts
- Verify that semantically similar texts have higher similarity scores

### 2. End-to-End API Test

Test the full API implementation:

```bash
cd backend
./test_vectorization.py --all
```

Options:
- `--db`: Test database schema upgrade
- `--ollama`: Test Ollama connection
- `--vectorize`: Test vectorization of stories
- `--analyze`: Test story analysis
- `--switch`: Test provider switching
- `--all`: Run all tests

## How it Works

### AI Provider Registry

We've implemented a structured provider registry for managing different AI providers:

```python
class AIProviderRegistry:
    def __init__(self):
        self.providers = {}
        self.current_provider = None
        
    def register_provider(self, provider_name: str, config: ProviderConfig):
        # Register a provider with its configuration
        
    def get_provider(self, provider_name: str) -> Optional[ProviderConfig]:
        # Get a provider's configuration
    
    def get_current_provider(self) -> Optional[ProviderConfig]:
        # Get the current active provider
```

### Vector Embeddings Generation

Stories are processed using the Sentence Transformers library with the Chinese-enhanced model:

```python
vector_embedding = sentence_transformer.encode(content).tolist()
```

### Semantic Similarity Search

When finding similar stories, the application calculates cosine similarity between story embeddings:

```python
# Calculate cosine similarity
dot_product = sum(a * b for a, b in zip(vector_embedding, s_embedding))
magnitude_a = sum(a ** 2 for a in vector_embedding) ** 0.5
magnitude_b = sum(b ** 2 for b in s_embedding) ** 0.5

similarity = dot_product / (magnitude_a * magnitude_b)
```

### LLM Provider Switching

The application dynamically handles switching between providers:

```python
async def call_llm_provider(messages):
    current_provider = ai_provider_registry.get_current_provider()
    provider_name = ai_provider_registry.current_provider
    
    if provider_name == AIProvider.OPENROUTER:
        return await call_openrouter(messages)
    elif provider_name == AIProvider.OLLAMA:
        return await call_ollama(messages)
    # ... fallback handling
```

## Improved MongoDB Connection Handling

The application now has improved MongoDB connection handling:

- Connection validation and automatic reconnection
- Collection verification to ensure required collections exist
- Schema upgrade to ensure all necessary fields are present
- Performance optimizations with appropriate indexes

## Troubleshooting

### Vector Embeddings Issues

- If stories aren't being vectorized properly, run: `curl -X POST http://localhost:8000/api/database/upgrade-schema`
- Then run: `curl -X POST http://localhost:8000/api/stories/vectorize-all?limit=100`
- Check the logs for any errors during the vectorization process

### Ollama Connection Issues

- Ensure Ollama is running with `ollama serve`
- Verify the model is downloaded with `ollama list`
- Test the connection: `curl http://localhost:8000/config/test-ollama`
- Check the Ollama URL in the `.env` file (default is `http://localhost:11434`)

### OpenRouter Issues

- Verify your API key is correct in the `.env` file
- Check the current configuration: `curl http://localhost:8000/config`

## Backup and Maintenance

The vector embeddings are stored directly in your MongoDB database in the `stories` collection. To manage the database:

1. Regular backups are recommended
2. If you change the embedding model, use the `/api/stories/vectorize-all` endpoint to update all stories
3. Monitor the size of your database as embeddings increase its storage requirements 
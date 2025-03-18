# Performance Optimization Guide

This document outlines the performance optimizations implemented in the 2Dots1Line AI Service backend.

## 1. Optimized Sentence Transformer with GPU Support

The embedding model now automatically detects and uses GPU acceleration if available:

```python
device = "cuda" if torch.cuda.is_available() else "cpu"
sentence_transformer = SentenceTransformer(EMBEDDING_MODEL, device=device)
```

- **Benefit**: Up to 10x speedup for embedding generation when using GPU
- **Usage**: No changes needed, the system detects GPU automatically

## 2. Efficient NLTK Data Management

NLTK data downloads are now properly managed:

```python
nltk_data_path = os.path.expanduser("~/.nltk_data")
nltk.data.path.append(nltk_data_path)

if not os.path.exists(nltk_data_path):
    os.makedirs(nltk_data_path, exist_ok=True)

try:
    nltk.data.find('tokenizers/punkt', paths=[nltk_data_path])
except LookupError:
    nltk.download('punkt', download_dir=nltk_data_path)
```

- **Benefit**: Prevents repeated downloads of NLTK data during server restarts
- **Storage**: All NLTK data is stored in `~/.nltk_data` for persistence

## 3. Optimized AI Provider Selection

AI provider selection is now more explicit and provides clear debugging messages:

```python
if AI_PROVIDER == "openrouter":
    # OpenRouter configuration
    print(f"✅ Using OpenRouter with model: {OPENROUTER_MODEL}")
elif AI_PROVIDER == "ollama":
    # Ollama configuration
    print(f"✅ Using Ollama locally with model: {OLLAMA_MODEL}")
```

- **Benefit**: Clear provider selection, easier debugging
- **Configuration**: Set `AI_PROVIDER` in `.env` file to "openrouter", "ollama", or "cloud"

## 4. Streaming API for AI Responses

Added a streaming API endpoint for more responsive AI:

```bash
curl -X POST "http://localhost:8000/api/ai/stream" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Tell me a story about a dragon"}'
```

- **Benefit**: Responses begin showing immediately rather than waiting for completion
- **Endpoint**: `/api/ai/stream` accepts POST requests with a "prompt" field

## 5. Optimized MongoDB Vector Search

Story similarity now uses MongoDB's `$vectorSearch` when available:

```python
results = stories_collection.aggregate([
    {
        "$search": {
            "vectorSearch": {
                "queryVector": vector_embedding,
                "path": "vectorEmbedding",
                "numCandidates": top_k * 2,
                "limit": top_k
            }
        }
    },
    # Additional pipeline stages...
])
```

- **Benefit**: Much faster similarity search for large collections
- **Fallback**: Automatically falls back to manual calculation if unavailable

## 6. Batch Processing for Vectorization

Stories are now processed in batches for vectorization:

```bash
# Vectorize with custom batch size
curl -X POST "http://localhost:8000/api/stories/vectorize-all?batch_size=20"
```

- **Benefit**: Up to 5x faster vectorization with larger batches
- **Parameters**: 
  - `limit`: Maximum stories to process (default: 100)
  - `batch_size`: Batch size for processing (default: 10)

## 7. Database Optimization with Indexes

Added database indexes for faster queries:

```bash
# Create optimized indexes
curl -X POST "http://localhost:8000/api/database/optimize-indexes"
```

- **Benefit**: Faster queries, especially for large collections
- **Indexes**: Created for child, embedding model, timestamps, etc.

## 8. Multi-Worker Server Configuration

The server now uses multiple worker processes:

```python
uvicorn.run("app:app", host="0.0.0.0", port=8000, workers=4)
```

- **Benefit**: Better CPU utilization, handles concurrent requests more efficiently
- **Scaling**: Adjust worker count based on available CPU cores

## Usage and Testing

### Testing GPU Detection

```bash
curl -X GET "http://localhost:8000/health"
```

Look for the `embedding` section in the response to confirm device.

### Performance Benchmarking

```bash
# Test vectorization of all stories
time curl -X POST "http://localhost:8000/api/stories/vectorize-all"

# Test with different batch sizes
time curl -X POST "http://localhost:8000/api/stories/vectorize-all?batch_size=5"
time curl -X POST "http://localhost:8000/api/stories/vectorize-all?batch_size=20"
```

Compare the execution times to find the optimal batch size for your hardware.

## Troubleshooting

### GPU Not Detected

If GPU is available but not being used:

1. Ensure PyTorch is installed with CUDA support
2. Check CUDA is properly installed on your system
3. Run `python -c "import torch; print(torch.cuda.is_available())"` to verify

### Slow Embedding Generation

If embedding generation is still slow:

1. Try increasing batch sizes for vectorization
2. Consider using a smaller embedding model
3. Use a dedicated server with GPU for production workloads

### Database Optimizations Not Working

If MongoDB queries are still slow:

1. Ensure indexes were properly created
2. Consider using MongoDB Atlas with vector search capabilities
3. Run the optimize-indexes endpoint to create missing indexes 
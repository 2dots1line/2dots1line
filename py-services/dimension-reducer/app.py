"""
Dimension Reducer Service
V9.5 Python microservice for generating 3D projections of knowledge graphs

This service provides dimensionality reduction capabilities for the GraphProjectionWorker,
converting high-dimensional embeddings into 3D coordinates for visualization.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import numpy as np
import logging
import time
from contextlib import asynccontextmanager

# Import dimension reduction libraries
try:
    import umap
    UMAP_AVAILABLE = True
except ImportError:
    UMAP_AVAILABLE = False
    logging.warning("UMAP not available - install with: pip install umap-learn")

try:
    from sklearn.manifold import TSNE
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logging.warning("scikit-learn not available - install with: pip install scikit-learn")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class DimensionReductionRequest(BaseModel):
    vectors: List[List[float]] = Field(..., description="High-dimensional vectors to reduce")
    method: Literal["umap", "tsne"] = Field(default="umap", description="Reduction method")
    target_dimensions: int = Field(default=3, ge=2, le=3, description="Target dimensions (2 or 3)")
    n_neighbors: Optional[int] = Field(default=15, ge=2, description="Number of neighbors for UMAP")
    min_dist: Optional[float] = Field(default=1.0, ge=0.0, le=1.0, description="Minimum distance for UMAP")
    perplexity: Optional[float] = Field(default=30.0, ge=5.0, le=50.0, description="Perplexity for t-SNE")
    random_state: Optional[int] = Field(default=42, description="Random state for reproducibility")
    spread: Optional[float] = Field(default=5.0, ge=0.1, le=10.0, description="Spread for UMAP")

class DimensionReductionResponse(BaseModel):
    coordinates: List[List[float]] = Field(..., description="Reduced coordinates")
    method: str = Field(..., description="Method used for reduction")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    input_dimensions: int = Field(..., description="Original vector dimensions")
    output_dimensions: int = Field(..., description="Output dimensions")
    n_samples: int = Field(..., description="Number of samples processed")

class HealthResponse(BaseModel):
    status: str
    umap_available: bool
    sklearn_available: bool
    version: str = "1.0.0"

# Note: Reducer caching removed for stateless microservice design
# Each request creates fresh reducer instances for better isolation

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting Dimension Reducer Service v1.0.0")
    logger.info(f"UMAP available: {UMAP_AVAILABLE}")
    logger.info(f"scikit-learn available: {SKLEARN_AVAILABLE}")
    yield
    logger.info("Shutting down Dimension Reducer Service")

# Initialize FastAPI app
app = FastAPI(
    title="Dimension Reducer Service",
    description="Microservice for dimensionality reduction of knowledge graph embeddings",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        umap_available=UMAP_AVAILABLE,
        sklearn_available=SKLEARN_AVAILABLE
    )

@app.post("/reduce", response_model=DimensionReductionResponse)
async def reduce_dimensions(request: DimensionReductionRequest):
    """
    Reduce high-dimensional vectors to 2D or 3D coordinates
    """
    start_time = time.time()
    
    try:
        # Validate input
        if not request.vectors:
            raise HTTPException(status_code=400, detail="No vectors provided")
        
        if len(request.vectors) < 2:
            raise HTTPException(status_code=400, detail="At least 2 vectors required")
        
        # Convert to numpy array
        try:
            X = np.array(request.vectors, dtype=np.float32)
        except (ValueError, TypeError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid vector format: {str(e)}")
        
        if X.ndim != 2:
            raise HTTPException(status_code=400, detail="Vectors must be 2-dimensional array")
        
        n_samples, input_dims = X.shape
        logger.info(f"Processing {n_samples} vectors with {input_dims} dimensions using {request.method}")
        
        # Validate parameters based on sample size
        if request.method == "umap" and request.n_neighbors:
            if request.n_neighbors >= n_samples:
                request.n_neighbors = max(2, n_samples - 1)
                logger.warning(f"Adjusted n_neighbors to {request.n_neighbors} for {n_samples} samples")
        
        # For very small datasets, fall back to simple coordinate generation
        # UMAP requires at least 10 samples for reliable manifold learning
        if n_samples < 10:
            logger.warning(f"Dataset too small ({n_samples} samples) for reliable dimension reduction, using simple layout")
            coordinates = _generate_simple_layout(n_samples, request.target_dimensions)
            processing_time = int((time.time() - start_time) * 1000)
            return DimensionReductionResponse(
                coordinates=coordinates.tolist(),
                method=f"{request.method}_simple",
                processing_time_ms=processing_time,
                input_dimensions=input_dims,
                output_dimensions=request.target_dimensions,
                n_samples=n_samples
            )
        
        # Perform dimension reduction
        if request.method == "umap":
            coordinates = _reduce_with_umap(X, request)
        elif request.method == "tsne":
            coordinates = _reduce_with_tsne(X, request)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown method: {request.method}")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Reduction completed in {processing_time}ms")
        
        return DimensionReductionResponse(
            coordinates=coordinates.tolist(),
            method=request.method,
            processing_time_ms=processing_time,
            input_dimensions=input_dims,
            output_dimensions=request.target_dimensions,
            n_samples=n_samples
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during dimension reduction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def _reduce_with_umap(X: np.ndarray, request: DimensionReductionRequest) -> np.ndarray:
    """Reduce dimensions using UMAP"""
    if not UMAP_AVAILABLE:
        raise HTTPException(status_code=503, detail="UMAP not available")
    
    try:
        # Adjust parameters for small datasets
        n_samples = X.shape[0]
        n_neighbors = min(request.n_neighbors or 15, n_samples - 1)
        n_neighbors = max(2, n_neighbors)
        
        reducer = umap.UMAP(
            n_components=request.target_dimensions,
            n_neighbors=n_neighbors,
            min_dist=request.min_dist if request.min_dist is not None else 1.0,
            spread=request.spread if request.spread is not None else 5.0,
            random_state=request.random_state or 42,
            metric='cosine',
            verbose=False
        )
        
        coordinates = reducer.fit_transform(X)
        
        # Normalize coordinates to reasonable range [-10, 10]
        coordinates = _normalize_coordinates(coordinates, target_range=50.0)
        
        return coordinates
        
    except Exception as e:
        logger.error(f"UMAP reduction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"UMAP reduction failed: {str(e)}")

def _reduce_with_tsne(X: np.ndarray, request: DimensionReductionRequest) -> np.ndarray:
    """Reduce dimensions using t-SNE"""
    if not SKLEARN_AVAILABLE:
        raise HTTPException(status_code=503, detail="scikit-learn not available")
    
    try:
        # Adjust perplexity for small datasets
        n_samples = X.shape[0]
        perplexity = min(request.perplexity or 30.0, (n_samples - 1) / 3.0)
        perplexity = max(5.0, perplexity)
        
        reducer = TSNE(
            n_components=request.target_dimensions,
            perplexity=perplexity,
            random_state=request.random_state or 42,
            metric='cosine',  # Good for embeddings
            init='random',
            learning_rate='auto',
            max_iter=1000,
            verbose=0
        )
        
        coordinates = reducer.fit_transform(X)
        
        # Normalize coordinates to reasonable range [-10, 10]
        coordinates = _normalize_coordinates(coordinates, target_range=50.0)
        
        return coordinates
        
    except Exception as e:
        logger.error(f"t-SNE reduction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"t-SNE reduction failed: {str(e)}")

def _generate_simple_layout(n_samples: int, target_dimensions: int) -> np.ndarray:
    """Generate simple layout for very small datasets"""
    coordinates = np.zeros((n_samples, target_dimensions))
    
    if n_samples == 1:
        # Single point at origin
        pass  # Already zeros
    elif n_samples == 2:
        # Two points on opposite sides
        coordinates[0, 0] = -5.0
        coordinates[1, 0] = 5.0
    elif n_samples == 3:
        # Triangle layout
        coordinates[0] = [-5.0, -2.5, 0.0][:target_dimensions]
        coordinates[1] = [5.0, -2.5, 0.0][:target_dimensions]
        coordinates[2] = [0.0, 5.0, 0.0][:target_dimensions]
    else:
        # For 4-9 samples, use circular layout
        import math
        radius = 5.0
        for i in range(n_samples):
            angle = 2 * math.pi * i / n_samples
            coordinates[i, 0] = radius * math.cos(angle)
            coordinates[i, 1] = radius * math.sin(angle)
            if target_dimensions == 3:
                # Add some z-variation for 3D
                coordinates[i, 2] = 2.0 * math.sin(4 * angle)
    
    return coordinates

def _normalize_coordinates(coordinates: np.ndarray, target_range: float = 10.0) -> np.ndarray:
    """Normalize coordinates to a target range [-target_range, target_range]"""
    # Calculate current range
    min_vals = np.min(coordinates, axis=0)
    max_vals = np.max(coordinates, axis=0)
    ranges = max_vals - min_vals
    
    # Avoid division by zero
    ranges = np.where(ranges == 0, 1, ranges)
    
    # Normalize to [-1, 1] then scale to target range
    normalized = 2 * (coordinates - min_vals) / ranges - 1
    scaled = normalized * target_range
    
    return scaled

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Dimension Reducer",
        "version": "1.0.0",
        "status": "running",
        "endpoints": ["/health", "/reduce"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

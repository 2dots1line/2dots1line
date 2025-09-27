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
    method: Literal["umap", "tsne", "hybrid_umap"] = Field(default="hybrid_umap", description="Reduction method")
    target_dimensions: int = Field(default=3, ge=2, le=3, description="Target dimensions (2 or 3)")
    n_neighbors: Optional[int] = Field(default=15, ge=2, description="Number of neighbors for UMAP")
    min_dist: Optional[float] = Field(default=0.8, ge=0.0, le=1.0, description="Minimum distance for UMAP")
    perplexity: Optional[float] = Field(default=30.0, ge=5.0, le=50.0, description="Perplexity for t-SNE")
    random_state: Optional[int] = Field(default=42, description="Random state for reproducibility")
    spread: Optional[float] = Field(default=3.0, ge=0.1, le=10.0, description="Spread for UMAP")
    # V11.0 Cosmos: Hybrid UMAP parameters
    use_linear_transformation: bool = Field(default=True, description="Use linear transformation for incremental positioning")
    existing_coordinates: Optional[List[List[float]]] = Field(default=None, description="Existing coordinates for incremental updates")
    transformation_matrix: Optional[List[List[float]]] = Field(default=None, description="4x4 transformation matrix for linear positioning")

class DimensionReductionResponse(BaseModel):
    coordinates: List[List[float]] = Field(..., description="Reduced coordinates")
    method: str = Field(..., description="Method used for reduction")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    input_dimensions: int = Field(..., description="Original vector dimensions")
    output_dimensions: int = Field(..., description="Output dimensions")
    n_samples: int = Field(..., description="Number of samples processed")
    # V11.0 Cosmos: Hybrid UMAP response data
    transformation_matrix: Optional[List[List[float]]] = Field(default=None, description="4x4 transformation matrix for linear positioning")
    umap_parameters: Optional[dict] = Field(default=None, description="UMAP parameters used for this projection")
    is_incremental: bool = Field(default=False, description="Whether this was an incremental update")

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
        
        # For very small datasets, require at least 2 samples for UMAP
        if n_samples < 2:
            raise HTTPException(status_code=400, detail="At least 2 vectors required for dimension reduction")
        
        # Perform dimension reduction
        if request.method == "umap":
            coordinates = _reduce_with_umap(X, request)
        elif request.method == "tsne":
            coordinates = _reduce_with_tsne(X, request)
        elif request.method == "hybrid_umap":
            coordinates, transformation_matrix, umap_params = _reduce_with_hybrid_umap(X, request)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown method: {request.method}")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Reduction completed in {processing_time}ms")
        
        # Prepare response data
        response_data = {
            "coordinates": coordinates.tolist(),
            "method": request.method,
            "processing_time_ms": processing_time,
            "input_dimensions": input_dims,
            "output_dimensions": request.target_dimensions,
            "n_samples": n_samples
        }
        
        # Add hybrid UMAP specific data
        if request.method == "hybrid_umap":
            response_data.update({
                "transformation_matrix": transformation_matrix,
                "umap_parameters": umap_params,
                "is_incremental": request.existing_coordinates is not None
            })
        
        return DimensionReductionResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during dimension reduction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def _reduce_with_hybrid_umap(X: np.ndarray, request: DimensionReductionRequest) -> tuple[np.ndarray, List[List[float]], dict]:
    """
    V11.0 Cosmos: Hybrid UMAP + Linear Transformation system
    
    This implements the hybrid approach where:
    1. UMAP provides the initial manifold learning
    2. Linear transformation matrix enables incremental positioning
    3. Existing coordinates can be preserved and extended
    """
    if not UMAP_AVAILABLE:
        raise HTTPException(status_code=503, detail="UMAP not available")
    
    try:
        n_samples = X.shape[0]
        n_neighbors = min(request.n_neighbors or 15, n_samples - 1)
        n_neighbors = max(2, n_neighbors)
        
        # Store UMAP parameters for reproducibility
        umap_params = {
            "n_neighbors": n_neighbors,
            "min_dist": request.min_dist if request.min_dist is not None else 0.8,
            "spread": request.spread if request.spread is not None else 3.0,
            "random_state": request.random_state or 42,
            "metric": "cosine"
        }
        
        # Step 1: Generate UMAP coordinates
        reducer = umap.UMAP(
            n_components=request.target_dimensions,
            n_neighbors=n_neighbors,
            min_dist=umap_params["min_dist"],
            spread=umap_params["spread"],
            random_state=umap_params["random_state"],
            metric=umap_params["metric"],
            verbose=False
        )
        
        umap_coordinates = reducer.fit_transform(X)
        
        # Step 2: Apply linear transformation if requested
        if request.use_linear_transformation and request.transformation_matrix:
            # Apply 4x4 transformation matrix
            transformation_matrix = np.array(request.transformation_matrix)
            coordinates = _apply_transformation_matrix(umap_coordinates, transformation_matrix)
        elif request.existing_coordinates and len(request.existing_coordinates) > 0:
            # Incremental positioning: preserve existing coordinates and add new ones
            coordinates = _incremental_positioning(umap_coordinates, request.existing_coordinates)
            # Generate identity transformation matrix for incremental updates
            transformation_matrix = _generate_identity_matrix(request.target_dimensions)
        else:
            # Standard UMAP with normalization
            coordinates = _normalize_coordinates(umap_coordinates, target_range=50.0)
            # Generate identity transformation matrix
            transformation_matrix = _generate_identity_matrix(request.target_dimensions)
        
        return coordinates, transformation_matrix.tolist(), umap_params
        
    except Exception as e:
        logger.error(f"Hybrid UMAP reduction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Hybrid UMAP reduction failed: {str(e)}")

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

def _apply_transformation_matrix(coordinates: np.ndarray, transformation_matrix: np.ndarray) -> np.ndarray:
    """Apply 4x4 transformation matrix to 3D coordinates"""
    n_samples, n_dims = coordinates.shape
    
    # Convert to homogeneous coordinates
    if n_dims == 3:
        homogeneous = np.column_stack([coordinates, np.ones(n_samples)])
    else:
        # For 2D, add z=0 and w=1
        homogeneous = np.column_stack([coordinates, np.zeros(n_samples), np.ones(n_samples)])
    
    # Apply transformation
    transformed = homogeneous @ transformation_matrix.T
    
    # Convert back to original dimensions
    return transformed[:, :n_dims]

def _incremental_positioning(new_coordinates: np.ndarray, existing_coordinates: List[List[float]]) -> np.ndarray:
    """
    V11.0 Cosmos: Incremental positioning that preserves existing coordinates
    and positions new entities relative to them
    """
    existing = np.array(existing_coordinates)
    n_existing = len(existing)
    n_new = len(new_coordinates)
    
    if n_existing == 0:
        # No existing coordinates, use normalized new coordinates
        return _normalize_coordinates(new_coordinates, target_range=50.0)
    
    # Normalize new coordinates to a reasonable range
    normalized_new = _normalize_coordinates(new_coordinates, target_range=50.0)
    
    # Find the centroid of existing coordinates
    existing_centroid = np.mean(existing, axis=0)
    
    # Position new coordinates around the existing centroid
    # Add some offset to avoid overlap
    offset = np.array([10.0, 10.0, 5.0][:normalized_new.shape[1]])
    positioned_new = normalized_new + existing_centroid + offset
    
    return positioned_new

def _generate_identity_matrix(dimensions: int) -> np.ndarray:
    """Generate identity transformation matrix for the given dimensions"""
    if dimensions == 3:
        return np.array([
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ])
    else:  # 2D
        return np.array([
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0]
        ])

class MatrixCreationRequest(BaseModel):
    """Request for creating transformation matrices"""
    matrix_type: Literal["identity", "translation", "rotation", "scale"] = Field(..., description="Type of matrix to create")
    translation: Optional[List[float]] = Field(default=None, description="Translation vector [x, y, z]")
    rotation_axis: Optional[List[float]] = Field(default=None, description="Rotation axis [x, y, z]")
    rotation_angle: Optional[float] = Field(default=None, description="Rotation angle in radians")
    scale_factors: Optional[List[float]] = Field(default=None, description="Scale factors [x, y, z]")

class MatrixCreationResponse(BaseModel):
    """Response for matrix creation"""
    matrix: List[List[float]] = Field(..., description="4x4 transformation matrix")
    matrix_type: str = Field(..., description="Type of matrix created")
    parameters: dict = Field(..., description="Parameters used to create the matrix")

@app.post("/create-matrix", response_model=MatrixCreationResponse)
async def create_transformation_matrix(request: MatrixCreationRequest):
    """
    V11.0 Cosmos: Create transformation matrices for linear positioning
    """
    try:
        if request.matrix_type == "identity":
            matrix = _generate_identity_matrix(3)
            parameters = {}
        elif request.matrix_type == "translation":
            if not request.translation or len(request.translation) != 3:
                raise HTTPException(status_code=400, detail="Translation vector must have 3 elements [x, y, z]")
            matrix = _create_translation_matrix(request.translation)
            parameters = {"translation": request.translation}
        elif request.matrix_type == "rotation":
            if not request.rotation_axis or len(request.rotation_axis) != 3:
                raise HTTPException(status_code=400, detail="Rotation axis must have 3 elements [x, y, z]")
            if request.rotation_angle is None:
                raise HTTPException(status_code=400, detail="Rotation angle is required")
            matrix = _create_rotation_matrix(request.rotation_axis, request.rotation_angle)
            parameters = {
                "rotation_axis": request.rotation_axis,
                "rotation_angle": request.rotation_angle
            }
        elif request.matrix_type == "scale":
            if not request.scale_factors or len(request.scale_factors) != 3:
                raise HTTPException(status_code=400, detail="Scale factors must have 3 elements [x, y, z]")
            matrix = _create_scale_matrix(request.scale_factors)
            parameters = {"scale_factors": request.scale_factors}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown matrix type: {request.matrix_type}")
        
        return MatrixCreationResponse(
            matrix=matrix.tolist(),
            matrix_type=request.matrix_type,
            parameters=parameters
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Matrix creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Matrix creation failed: {str(e)}")

def _create_translation_matrix(translation: List[float]) -> np.ndarray:
    """Create 4x4 translation matrix"""
    matrix = np.eye(4)
    matrix[0, 3] = translation[0]
    matrix[1, 3] = translation[1]
    matrix[2, 3] = translation[2]
    return matrix

def _create_rotation_matrix(axis: List[float], angle: float) -> np.ndarray:
    """Create 4x4 rotation matrix around given axis"""
    # Normalize axis
    axis = np.array(axis)
    axis = axis / np.linalg.norm(axis)
    
    # Create rotation matrix using Rodrigues' formula
    cos_angle = np.cos(angle)
    sin_angle = np.sin(angle)
    
    # Skew-symmetric matrix
    K = np.array([
        [0, -axis[2], axis[1]],
        [axis[2], 0, -axis[0]],
        [-axis[1], axis[0], 0]
    ])
    
    # Rotation matrix
    R = np.eye(3) + sin_angle * K + (1 - cos_angle) * np.dot(K, K)
    
    # Convert to 4x4 homogeneous matrix
    matrix = np.eye(4)
    matrix[:3, :3] = R
    return matrix

def _create_scale_matrix(scale_factors: List[float]) -> np.ndarray:
    """Create 4x4 scale matrix"""
    matrix = np.eye(4)
    matrix[0, 0] = scale_factors[0]
    matrix[1, 1] = scale_factors[1]
    matrix[2, 2] = scale_factors[2]
    return matrix

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Dimension Reducer",
        "version": "1.0.0",
        "status": "running",
        "endpoints": ["/health", "/reduce", "/create-matrix"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

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
    from sklearn.linear_model import Ridge
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logging.warning("scikit-learn not available - install with: pip install scikit-learn")

try:
    import cloudpickle
    CLOUDPICKLE_AVAILABLE = True
except ImportError:
    CLOUDPICKLE_AVAILABLE = False
    cloudpickle = None
    logging.warning("cloudpickle not available - install with: pip install cloudpickle")


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class DimensionReductionRequest(BaseModel):
    vectors: List[List[float]] = Field(..., description="High-dimensional vectors to reduce")
    method: Literal["umap_learning", "linear_transformation", "umap_transform"] = Field(default="umap_learning", description="Reduction method")
    target_dimensions: int = Field(default=3, ge=2, le=3, description="Target dimensions (2 or 3)")
    n_neighbors: Optional[int] = Field(default=15, ge=2, description="Number of neighbors for UMAP")
    min_dist: Optional[float] = Field(default=0.8, ge=0.0, le=1.0, description="Minimum distance for UMAP")
    random_state: Optional[int] = Field(default=42, description="Random state for reproducibility")
    spread: Optional[float] = Field(default=3.0, ge=0.1, le=10.0, description="Spread for UMAP")
    # V11.0 Cosmos: Hybrid UMAP parameters
    use_linear_transformation: bool = Field(default=True, description="Use linear transformation for incremental positioning")
    transformation_matrix: Optional[List[List[float]]] = Field(default=None, description="4x4 transformation matrix for linear positioning")
    # V11.0 Cosmos: UMAP Transform parameters
    fitted_umap_model: Optional[List[int]] = Field(default=None, description="Serialized UMAP model as byte array for transform operations")

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
    # V11.0 Cosmos: UMAP Transform response data
    fitted_umap_model: Optional[List[int]] = Field(default=None, description="Serialized UMAP model as byte array")
    model_metadata: Optional[dict] = Field(default=None, description="Model size, training info, etc.")
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
        
        # Only require 2+ vectors for methods that need it (like UMAP learning)
        if request.method == "umap_learning" and len(request.vectors) < 2:
            raise HTTPException(status_code=400, detail="At least 2 vectors required for UMAP learning")
        
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
        if request.method == "umap_learning" and request.n_neighbors:
            if request.n_neighbors >= n_samples:
                request.n_neighbors = max(2, n_samples - 1)
                logger.warning(f"Adjusted n_neighbors to {request.n_neighbors} for {n_samples} samples")
        
        # For very small datasets, require at least 2 samples for UMAP learning
        if request.method == "umap_learning" and n_samples < 2:
            raise HTTPException(status_code=400, detail="At least 2 vectors required for UMAP learning")
        
        # Perform dimension reduction
        if request.method == "umap_learning":
            coordinates, transformation_matrix, fitted_model_bytes, umap_params, model_metadata = _reduce_with_umap_learning(X, request)
        elif request.method == "linear_transformation":
            # DISABLED: Linear transformation is disabled for simplicity
            raise HTTPException(status_code=400, detail="Linear transformation is disabled. Use umap_learning or umap_transform instead.")
        elif request.method == "umap_transform":
            coordinates = _reduce_with_umap_transform(X, request)
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
        
        # Add UMAP learning specific data
        if request.method == "umap_learning":
            response_data.update({
                "transformation_matrix": transformation_matrix,
                "umap_parameters": umap_params,
                "fitted_umap_model": list(fitted_model_bytes) if fitted_model_bytes else None,
                "model_metadata": model_metadata,
                "is_incremental": False
            })
        elif request.method == "umap_transform":
            response_data.update({
                "is_incremental": True
            })
        
        return DimensionReductionResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during dimension reduction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def _reduce_with_umap_learning(X: np.ndarray, request: DimensionReductionRequest) -> tuple[np.ndarray, List[List[float]], dict]:
    """
    V11.0 Cosmos: UMAP Learning Phase
    
    This implements the UMAP learning phase where:
    1. UMAP learns the manifold structure
    2. Ridge regression creates a linear transformation matrix
    3. Matrix enables fast, deterministic positioning of new nodes
    """
    if not UMAP_AVAILABLE:
        raise HTTPException(status_code=503, detail="UMAP not available")
    if not SKLEARN_AVAILABLE:
        raise HTTPException(status_code=503, detail="scikit-learn not available for Ridge regression")
    
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
        
        # Step 2: Create linear transformation matrix using Ridge regression
        # This is the key part of the hybrid system!
        transformation_matrix = _create_ridge_transformation_matrix(X, umap_coordinates)
        
        # Step 3: Serialize the fitted UMAP model
        if not CLOUDPICKLE_AVAILABLE:
            raise HTTPException(status_code=503, detail="cloudpickle not available for model serialization")
        
        fitted_model_bytes = cloudpickle.dumps(reducer)
        
        # Step 4: Create model metadata
        model_metadata = {
            "training_node_count": X.shape[0],
            "embedding_dimension": X.shape[1],
            "target_dimensions": request.target_dimensions,
            "model_size_bytes": len(fitted_model_bytes),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "umap_version": getattr(umap, '__version__', 'unknown')
        }
        
        # Step 5: Use raw UMAP coordinates (no normalization)
        coordinates = umap_coordinates
        
        logger.info(f"UMAP Learning: Created {transformation_matrix.shape} transformation matrix and {len(fitted_model_bytes)} byte fitted model")
        return coordinates, transformation_matrix.tolist(), fitted_model_bytes, umap_params, model_metadata
        
    except Exception as e:
        logger.error(f"UMAP learning failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"UMAP learning failed: {str(e)}")

def _reduce_with_linear_transformation(X: np.ndarray, request: DimensionReductionRequest) -> np.ndarray:
    """
    V11.0 Cosmos: Linear transformation for fast, deterministic positioning - DISABLED
    
    Uses a pre-computed transformation matrix to transform embeddings to 3D coordinates.
    This is the fast path for incremental updates between UMAP learning runs.
    
    DISABLED: Linear transformation is disabled for simplicity.
    """
    # DISABLED: Linear transformation is disabled for simplicity
    raise HTTPException(status_code=400, detail="Linear transformation is disabled. Use umap_learning or umap_transform instead.")
    
    try:
        if not request.transformation_matrix:
            raise HTTPException(status_code=400, detail="transformation_matrix is required for linear_transformation method")
        
        # Convert transformation matrix to numpy array
        transformation_matrix = np.array(request.transformation_matrix, dtype=np.float32)
        
        # Validate matrix dimensions
        if transformation_matrix.ndim != 2:
            raise HTTPException(status_code=400, detail="transformation_matrix must be 2-dimensional")
        
        # Expected: [embedding_dim, target_dimensions] matrix
        expected_cols = request.target_dimensions
        if transformation_matrix.shape[1] != expected_cols:
            raise HTTPException(
                status_code=400, 
                detail=f"transformation_matrix must have {expected_cols} columns for {request.target_dimensions}D output, got {transformation_matrix.shape[1]}"
            )
        
        # Validate input dimensions match matrix
        input_dims = X.shape[1]
        if transformation_matrix.shape[0] != input_dims:
            raise HTTPException(
                status_code=400,
                detail=f"transformation_matrix input dimension mismatch: matrix expects {transformation_matrix.shape[0]}D input, got {input_dims}D vectors"
            )
        
        # Apply linear transformation: coordinates = X @ transformation_matrix
        coordinates = np.dot(X, transformation_matrix)
        
        # Normalize coordinates to reasonable range
        coordinates = _normalize_coordinates(coordinates, target_range=50.0)
        
        logger.info(f"Linear transformation completed for {X.shape[0]} vectors using {transformation_matrix.shape} matrix")
        return coordinates
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Linear transformation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Linear transformation failed: {str(e)}")

def _reduce_with_umap_transform(X: np.ndarray, request: DimensionReductionRequest) -> np.ndarray:
    """
    V11.0 Cosmos: UMAP Transform Phase
    
    Uses a pre-computed fitted UMAP model to transform new embeddings to 3D coordinates.
    This provides high-quality positioning while maintaining the learned manifold structure.
    """
    if not UMAP_AVAILABLE:
        raise HTTPException(status_code=503, detail="UMAP not available")
    if not CLOUDPICKLE_AVAILABLE:
        raise HTTPException(status_code=503, detail="cloudpickle not available for model deserialization")
    
    try:
        if not request.fitted_umap_model:
            raise HTTPException(status_code=400, detail="fitted_umap_model is required for umap_transform method")
        
        # Convert byte array back to bytes
        fitted_model_bytes = bytes(request.fitted_umap_model)
        
        # Deserialize the fitted UMAP model
        fitted_model = cloudpickle.loads(fitted_model_bytes)
        
        # Transform new points using the fitted model
        coordinates = fitted_model.transform(X)
        
        # Use raw UMAP coordinates (no normalization)
        
        logger.info(f"UMAP transform completed for {X.shape[0]} new vectors using fitted model")
        return coordinates
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UMAP transform failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"UMAP transform failed: {str(e)}")


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


def _create_ridge_transformation_matrix(embeddings: np.ndarray, coordinates: np.ndarray) -> np.ndarray:
    """
    V11.0 Cosmos: Create linear transformation matrix using Ridge regression
    
    This is the core of the hybrid UMAP system. It learns a linear transformation
    that maps embeddings to UMAP coordinates, enabling fast positioning of new nodes.
    
    Args:
        embeddings: High-dimensional embeddings [n_samples, embedding_dim]
        coordinates: UMAP coordinates [n_samples, target_dimensions]
    
    Returns:
        transformation_matrix: [embedding_dim, target_dimensions] matrix
    """
    try:
        # Use Ridge regression to learn the transformation
        # Solves: coordinates = embeddings @ transformation_matrix
        # with L2 regularization to prevent overfitting
        
        ridge = Ridge(alpha=0.1, fit_intercept=False)  # No intercept for linear transformation
        ridge.fit(embeddings, coordinates)
        
        # Get the transformation matrix
        transformation_matrix = ridge.coef_.T  # [embedding_dim, target_dimensions]
        
        logger.info(f"Ridge regression: Created {transformation_matrix.shape} transformation matrix")
        logger.info(f"Ridge regression: R² score = {ridge.score(embeddings, coordinates):.4f}")
        
        return transformation_matrix
        
    except Exception as e:
        logger.error(f"Ridge regression failed: {str(e)}")
        # Fallback to identity matrix if Ridge regression fails
        embedding_dim = embeddings.shape[1]
        target_dim = coordinates.shape[1]
        return np.eye(embedding_dim, target_dim)

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

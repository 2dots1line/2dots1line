#!/usr/bin/env python3
"""
Test script for the embedding model.
This script tests the embedding model directly without going through the API.
"""

import argparse
import numpy as np
import time
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

def test_embedding_model(model_name, verbose=False):
    """Test the embedding model with some example texts"""
    print(f"Testing embedding model: {model_name}")
    
    try:
        # Load the model
        start_time = time.time()
        print(f"Loading model...")
        model = SentenceTransformer(model_name)
        load_time = time.time() - start_time
        print(f"Model loaded in {load_time:.2f} seconds")
        
        # Test texts
        texts = [
            "A child is playing in the park with a red ball.",
            "A kid is having fun at the playground with a crimson sphere.",
            "The stock market had a significant drop yesterday.",
            "My favorite fruit is apple, I eat one every day.",
            "The young girl is enjoying herself at the park with a red toy.",
            "Economic indicators show a major decline in financial markets."
        ]
        
        # Generate embeddings
        start_time = time.time()
        print(f"Generating embeddings for {len(texts)} texts...")
        embeddings = model.encode(texts)
        encode_time = time.time() - start_time
        print(f"Embeddings generated in {encode_time:.2f} seconds")
        
        # Print embedding dimensions
        print(f"Embedding dimensions: {embeddings.shape}")
        if verbose:
            print(f"Sample embedding (first 5 dimensions): {embeddings[0][:5]}")
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(embeddings)
        
        # Print similarity matrix
        print("\nSimilarity Matrix:")
        for i in range(len(texts)):
            for j in range(len(texts)):
                if i <= j:  # Only print upper triangular part
                    print(f"Similarity between text {i+1} and text {j+1}: {similarity_matrix[i][j]:.4f}")
        
        # Check if similar texts have higher similarity scores
        print("\nSemantic Similarity Check:")
        # These should be semantically similar (child playing in park)
        print(f"Text 1 and Text 2 similarity: {similarity_matrix[0][1]:.4f}")
        print(f"Text 1 and Text 5 similarity: {similarity_matrix[0][4]:.4f}")
        
        # These should be semantically similar (financial markets)
        print(f"Text 3 and Text 6 similarity: {similarity_matrix[2][5]:.4f}")
        
        # These should not be semantically similar
        print(f"Text 1 and Text 3 similarity: {similarity_matrix[0][2]:.4f}")
        print(f"Text 2 and Text 4 similarity: {similarity_matrix[1][3]:.4f}")
        
        return True
    except Exception as e:
        print(f"Error testing embedding model: {e}")
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Test the embedding model directly")
    parser.add_argument("--model", default="sentence-transformers/all-MiniLM-L6-v2", 
                        help="Embedding model name")
    parser.add_argument("--verbose", action="store_true", help="Print verbose output")
    args = parser.parse_args()
    
    success = test_embedding_model(args.model, args.verbose)
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main()) 
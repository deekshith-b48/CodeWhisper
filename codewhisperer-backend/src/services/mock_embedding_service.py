import numpy as np
from typing import List, Dict, Any
import logging
import hashlib

logger = logging.getLogger(__name__)

class MockEmbeddingService:
    """
    Mock embedding service for demonstration purposes.
    Generates consistent embeddings based on text content hash.
    """
    
    def __init__(self):
        self.embedding_dim = 1536  # Standard OpenAI embedding dimension
        
    def create_embedding(self, text: str) -> List[float]:
        """
        Create a mock embedding for a single text string
        """
        try:
            # Create a deterministic embedding based on text hash
            text_hash = hashlib.md5(text.encode()).hexdigest()
            
            # Use hash to seed random number generator for consistency
            np.random.seed(int(text_hash[:8], 16))
            
            # Generate random embedding
            embedding = np.random.normal(0, 1, self.embedding_dim)
            
            # Normalize to unit vector
            embedding = embedding / np.linalg.norm(embedding)
            
            return embedding.tolist()
            
        except Exception as e:
            logger.error(f"Error creating mock embedding: {str(e)}")
            # Return zero vector as fallback
            return [0.0] * self.embedding_dim
    
    def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Create embeddings for multiple texts in batch
        """
        try:
            embeddings = []
            for text in texts:
                embedding = self.create_embedding(text)
                embeddings.append(embedding)
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Error creating batch mock embeddings: {str(e)}")
            # Return zero vectors as fallback
            return [[0.0] * self.embedding_dim for _ in texts]
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings
        """
        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {str(e)}")
            return 0.0


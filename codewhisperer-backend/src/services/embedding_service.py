import openai
import numpy as np
from typing import List, Dict, Any
import logging
import time
import os

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        # Use standard OpenAI API for embeddings
        self.client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url="https://api.openai.com/v1"  # Use standard OpenAI API
        )
        self.model = "text-embedding-3-small"  # Using OpenAI's latest embedding model
        self.max_tokens = 8191  # Maximum tokens for the embedding model
        
    def create_embedding(self, text: str) -> List[float]:
        """
        Create embedding for a single text string
        """
        try:
            # Clean and truncate text if necessary
            cleaned_text = self._clean_text(text)
            
            response = self.client.embeddings.create(
                model=self.model,
                input=cleaned_text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error creating embedding: {str(e)}")
            raise
    
    def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Create embeddings for multiple texts in batch
        """
        try:
            # Clean texts
            cleaned_texts = [self._clean_text(text) for text in texts]
            
            # Process in batches to avoid API limits
            batch_size = 100
            all_embeddings = []
            
            for i in range(0, len(cleaned_texts), batch_size):
                batch = cleaned_texts[i:i + batch_size]
                
                response = self.client.embeddings.create(
                    model=self.model,
                    input=batch
                )
                
                batch_embeddings = [data.embedding for data in response.data]
                all_embeddings.extend(batch_embeddings)
                
                # Rate limiting
                time.sleep(0.1)
            
            return all_embeddings
            
        except Exception as e:
            logger.error(f"Error creating batch embeddings: {str(e)}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and prepare text for embedding
        """
        if not text:
            return ""
        
        # Remove excessive whitespace
        cleaned = " ".join(text.split())
        
        # Truncate if too long (rough token estimation: 1 token ≈ 4 characters)
        max_chars = self.max_tokens * 4
        if len(cleaned) > max_chars:
            cleaned = cleaned[:max_chars]
            logger.warning(f"Text truncated from {len(text)} to {len(cleaned)} characters")
        
        return cleaned
    
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


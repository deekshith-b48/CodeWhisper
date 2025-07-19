import google.generativeai as genai
import numpy as np
from typing import List, Dict, Any
import logging
import time
import os

logger = logging.getLogger(__name__)

class GeminiEmbeddingService:
    """
    Gemini-based embedding service for text embeddings
    """
    
    def __init__(self):
        # Configure Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        
        # Use Gemini's embedding model
        self.model = "models/embedding-001"
        self.max_tokens = 2048  # Gemini embedding model limit
        
    def create_embedding(self, text: str) -> List[float]:
        """
        Create embedding for a single text string using Gemini
        """
        try:
            # Clean and truncate text if necessary
            cleaned_text = self._clean_text(text)
            
            # Generate embedding using Gemini
            result = genai.embed_content(
                model=self.model,
                content=cleaned_text,
                task_type="retrieval_document",
                title="Document for embedding"
            )
            
            return result['embedding']
            
        except Exception as e:
            logger.error(f"Error creating Gemini embedding: {str(e)}")
            raise
    
    def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Create embeddings for multiple texts in batch
        """
        try:
            # Clean texts
            cleaned_texts = [self._clean_text(text) for text in texts]
            
            # Process texts one by one (Gemini doesn't support batch embedding yet)
            all_embeddings = []
            
            for text in cleaned_texts:
                try:
                    result = genai.embed_content(
                        model=self.model,
                        content=text,
                        task_type="retrieval_document",
                        title="Document for embedding"
                    )
                    all_embeddings.append(result['embedding'])
                    
                    # Rate limiting to avoid hitting API limits
                    time.sleep(0.1)
                    
                except Exception as e:
                    logger.error(f"Error creating embedding for text: {str(e)}")
                    # Use a zero vector as fallback
                    all_embeddings.append([0.0] * 768)  # Gemini embedding dimension
            
            return all_embeddings
            
        except Exception as e:
            logger.error(f"Error creating batch Gemini embeddings: {str(e)}")
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

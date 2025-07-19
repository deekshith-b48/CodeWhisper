import numpy as np
import pickle
import os
from typing import List, Dict, Any, Tuple
import logging
from dataclasses import dataclass
import uuid

logger = logging.getLogger(__name__)

@dataclass
class VectorEntry:
    id: str
    embedding: List[float]
    metadata: Dict[str, Any]
    text: str

class VectorDatabaseService:
    def __init__(self, storage_path: str = None):
        self.storage_path = storage_path or os.path.join(os.path.dirname(__file__), '..', 'database', 'vectors.pkl')
        self.vectors: Dict[str, VectorEntry] = {}
        self.load_vectors()
    
    def add_vector(self, text: str, embedding: List[float], metadata: Dict[str, Any] = None) -> str:
        """
        Add a vector to the database
        """
        try:
            vector_id = str(uuid.uuid4())
            entry = VectorEntry(
                id=vector_id,
                embedding=embedding,
                metadata=metadata or {},
                text=text
            )
            
            self.vectors[vector_id] = entry
            self.save_vectors()
            
            logger.info(f"Added vector {vector_id} to database")
            return vector_id
            
        except Exception as e:
            logger.error(f"Error adding vector: {str(e)}")
            raise
    
    def add_vectors_batch(self, entries: List[Tuple[str, List[float], Dict[str, Any]]]) -> List[str]:
        """
        Add multiple vectors in batch
        """
        try:
            vector_ids = []
            
            for text, embedding, metadata in entries:
                vector_id = str(uuid.uuid4())
                entry = VectorEntry(
                    id=vector_id,
                    embedding=embedding,
                    metadata=metadata or {},
                    text=text
                )
                
                self.vectors[vector_id] = entry
                vector_ids.append(vector_id)
            
            self.save_vectors()
            logger.info(f"Added {len(vector_ids)} vectors to database")
            return vector_ids
            
        except Exception as e:
            logger.error(f"Error adding vectors batch: {str(e)}")
            raise
    
    def search_similar(self, query_embedding: List[float], top_k: int = 5, 
                      source_type_filter: str = None) -> List[Dict[str, Any]]:
        """
        Search for similar vectors
        """
        try:
            if not self.vectors:
                return []
            
            similarities = []
            query_vec = np.array(query_embedding)
            
            for vector_id, entry in self.vectors.items():
                # Apply source type filter if specified
                if source_type_filter and entry.metadata.get('source_type') != source_type_filter:
                    continue
                
                # Calculate cosine similarity
                entry_vec = np.array(entry.embedding)
                similarity = self._cosine_similarity(query_vec, entry_vec)
                
                similarities.append({
                    'id': vector_id,
                    'similarity': similarity,
                    'text': entry.text,
                    'metadata': entry.metadata
                })
            
            # Sort by similarity and return top_k
            similarities.sort(key=lambda x: x['similarity'], reverse=True)
            return similarities[:top_k]
            
        except Exception as e:
            logger.error(f"Error searching similar vectors: {str(e)}")
            return []
    
    def get_vector(self, vector_id: str) -> VectorEntry:
        """
        Get a specific vector by ID
        """
        return self.vectors.get(vector_id)
    
    def delete_vector(self, vector_id: str) -> bool:
        """
        Delete a vector from the database
        """
        try:
            if vector_id in self.vectors:
                del self.vectors[vector_id]
                self.save_vectors()
                logger.info(f"Deleted vector {vector_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error deleting vector: {str(e)}")
            return False
    
    def clear_database(self):
        """
        Clear all vectors from the database
        """
        try:
            self.vectors.clear()
            self.save_vectors()
            logger.info("Cleared vector database")
            
        except Exception as e:
            logger.error(f"Error clearing database: {str(e)}")
            raise
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get database statistics
        """
        try:
            source_types = {}
            for entry in self.vectors.values():
                source_type = entry.metadata.get('source_type', 'unknown')
                source_types[source_type] = source_types.get(source_type, 0) + 1
            
            return {
                'total_vectors': len(self.vectors),
                'source_types': source_types,
                'storage_path': self.storage_path
            }
            
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            return {}
    
    def save_vectors(self):
        """
        Save vectors to disk
        """
        try:
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, 'wb') as f:
                pickle.dump(self.vectors, f)
                
        except Exception as e:
            logger.error(f"Error saving vectors: {str(e)}")
            raise
    
    def load_vectors(self):
        """
        Load vectors from disk
        """
        try:
            if os.path.exists(self.storage_path):
                with open(self.storage_path, 'rb') as f:
                    self.vectors = pickle.load(f)
                logger.info(f"Loaded {len(self.vectors)} vectors from storage")
            else:
                logger.info("No existing vector storage found, starting with empty database")
                
        except Exception as e:
            logger.error(f"Error loading vectors: {str(e)}")
            self.vectors = {}
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two vectors
        """
        try:
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return float(dot_product / (norm1 * norm2))
            
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {str(e)}")
            return 0.0


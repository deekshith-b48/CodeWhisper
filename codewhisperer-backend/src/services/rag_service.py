import google.generativeai as genai
from typing import List, Dict, Any, Tuple
import logging
import time
import os
from src.services.gemini_embedding_service import GeminiEmbeddingService
from src.services.vector_db_service import VectorDatabaseService

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        # Configure Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            logger.warning("GEMINI_API_KEY not found. Using mock embedding service for demo.")
            from src.services.mock_embedding_service import MockEmbeddingService
            self.embedding_service = MockEmbeddingService()
            self.use_gemini = False
        else:
            genai.configure(api_key=api_key)
            self.embedding_service = GeminiEmbeddingService()
            self.use_gemini = True
            
        self.vector_db = VectorDatabaseService()
        self.model = "gemini-1.5-flash"  # Using Gemini for chat completions
        
    def query(self, user_query: str, source_type_filter: str = None, 
              max_context_length: int = 4000) -> Dict[str, Any]:
        """
        Process a user query using RAG
        """
        start_time = time.time()
        
        try:
            # Step 1: Create embedding for the user query
            query_embedding = self.embedding_service.create_embedding(user_query)
            
            # Step 2: Retrieve relevant documents
            similar_docs = self.vector_db.search_similar(
                query_embedding, 
                top_k=10, 
                source_type_filter=source_type_filter
            )
            
            # Step 3: Check if we have relevant documents
            if not similar_docs or len(similar_docs) == 0:
                return {
                    'response': "Sorry, I do not have access to this information.",
                    'sources': [],
                    'processing_time': time.time() - start_time,
                    'context_used': 0,
                    'success': True,
                    'no_relevant_docs': True
                }
            
            # Step 4: Prepare context from retrieved documents
            context = self._prepare_context(similar_docs, max_context_length)
            
            # Step 5: Generate response using LLM
            response = self._generate_response(user_query, context, similar_docs)
            
            # Step 6: Prepare sources information
            sources = self._prepare_sources(similar_docs[:5])  # Top 5 sources
            
            processing_time = time.time() - start_time
            
            return {
                'response': response,
                'sources': sources,
                'processing_time': processing_time,
                'context_used': len(similar_docs),
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return {
                'response': "❌ **Oops!** I encountered an error while processing your query. Please try again or contact support if the issue persists.",
                'sources': [],
                'processing_time': time.time() - start_time,
                'context_used': 0,
                'success': False,
                'error': str(e)
            }
    
    def _prepare_context(self, similar_docs: List[Dict[str, Any]], max_length: int) -> str:
        """
        Prepare context string from retrieved documents
        """
        context_parts = []
        current_length = 0
        
        for i, doc in enumerate(similar_docs):
            doc_text = doc['text']
            metadata = doc['metadata']
            
            # Format the document with metadata
            source_info = f"[Source {i+1}]"
            if metadata.get('source_type'):
                source_info += f" Type: {metadata['source_type']}"
            if metadata.get('title'):
                source_info += f" | Title: {metadata['title']}"
            if metadata.get('file_path'):
                source_info += f" | File: {metadata['file_path']}"
            if metadata.get('repository'):
                source_info += f" | Repo: {metadata['repository']}"
            if metadata.get('author'):
                source_info += f" | Author: {metadata['author']}"
            
            formatted_doc = f"{source_info}\n{doc_text}\n"
            
            # Check if adding this document would exceed max length
            if current_length + len(formatted_doc) > max_length:
                break
            
            context_parts.append(formatted_doc)
            current_length += len(formatted_doc)
        
        return "\n---\n".join(context_parts)
    
    def _generate_response(self, user_query: str, context: str, similar_docs: List[Dict[str, Any]]) -> str:
        """
        Generate response using Gemini LLM with retrieved context and citations
        """
        system_prompt = """You are CodeWhisperer, an AI-powered developer onboarding assistant. Your role is to help new developers understand codebases, documentation, and internal processes.

CRITICAL RULES:
1. ONLY answer based on the provided context from the knowledge base
2. If the context doesn't contain enough information to answer the question, say "Sorry, I do not have access to this information."
3. DO NOT use any external knowledge or general information
4. DO NOT make assumptions or provide information not present in the context
5. Always provide comprehensive, helpful answers based on the provided context
6. Use markdown formatting for better readability
7. When referencing information from sources, mention the source number (e.g., "According to Source 1..." or "As mentioned in Source 2...")
8. Be conversational but professional
9. Use bullet points and code blocks when appropriate
10. Always acknowledge the sources you're using in your response

Available context from knowledge base:
{context}

Remember: Only use the information provided in the context above. If you cannot answer the question with this information, respond with "Sorry, I do not have access to this information."."""

        user_prompt = f"""Based on the context provided above, please answer the following question:

**Question:** {user_query}

Please provide a comprehensive answer that helps the developer understand the topic. Make sure to:
- Reference specific sources when providing information
- Use clear, structured formatting
- Be specific about which documents you're citing
- Provide actionable insights when possible"""

        try:
            if self.use_gemini:
                # Use Gemini for response generation
                model = genai.GenerativeModel(self.model)
                
                # Combine system and user prompts for Gemini
                full_prompt = f"{system_prompt.format(context=context)}\n\n{user_prompt}"
                
                response = model.generate_content(
                    full_prompt,
                    generation_config={
                        "temperature": 0.7,
                        "max_output_tokens": 2000,
                    }
                )
                
                # Post-process the response to ensure proper citation formatting
                processed_response = self._post_process_response(response.text, similar_docs)
                return processed_response
            else:
                # Fallback response when no API key is available
                return f"""🤖 **AI Response (Demo Mode)**

I apologize, but I cannot generate a proper response without a valid Gemini API key. However, I found {len(context.split('---')) if context else 0} relevant documents in your knowledge base related to your question.

**Your Question:** {user_query}

**Available Sources:** {len(similar_docs)} documents found

To get full AI-powered responses with citations, please configure your Gemini API key in the environment variables."""
            
        except Exception as e:
            logger.error(f"Error generating Gemini response: {str(e)}")
            raise
    
    def _post_process_response(self, response: str, similar_docs: List[Dict[str, Any]]) -> str:
        """
        Post-process the response to ensure proper citation formatting
        """
        # Add a header if not present
        if not response.startswith('#'):
            response = f"🤖 **AI Response**\n\n{response}"
        
        # Ensure proper source citations
        for i, doc in enumerate(similar_docs[:5]):  # Top 5 sources
            metadata = doc['metadata']
            source_ref = f"Source {i+1}"
            
            # Add source information at the end if not already present
            if source_ref not in response and metadata.get('title'):
                response += f"\n\n**{source_ref}:** {metadata['title']}"
                if metadata.get('file_path'):
                    response += f" ({metadata['file_path']})"
        
        return response
    
    def _prepare_sources(self, similar_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Prepare sources information for the response
        """
        sources = []
        
        for i, doc in enumerate(similar_docs):
            metadata = doc['metadata']
            source = {
                'similarity': round(doc['similarity'], 3),
                'source_type': metadata.get('source_type', 'unknown'),
                'title': metadata.get('title', f'Document {i+1}'),
                'url': metadata.get('source_url', ''),
                'file_path': metadata.get('file_path', ''),
                'repository': metadata.get('repository', ''),
                'author': metadata.get('author', ''),
                'preview': doc['text'][:300] + '...' if len(doc['text']) > 300 else doc['text'],
                'source_number': i + 1
            }
            sources.append(source)
        
        return sources
    
    def add_document(self, text: str, metadata: Dict[str, Any]) -> str:
        """
        Add a document to the knowledge base
        """
        try:
            # Create embedding for the document
            embedding = self.embedding_service.create_embedding(text)
            
            # Add to vector database
            vector_id = self.vector_db.add_vector(text, embedding, metadata)
            
            logger.info(f"Added document to knowledge base: {vector_id}")
            return vector_id
            
        except Exception as e:
            logger.error(f"Error adding document: {str(e)}")
            raise
    
    def add_documents_batch(self, documents: List[Tuple[str, Dict[str, Any]]]) -> List[str]:
        """
        Add multiple documents to the knowledge base
        """
        try:
            # Create embeddings for all documents
            texts = [doc[0] for doc in documents]
            embeddings = self.embedding_service.create_embeddings_batch(texts)
            
            # Prepare entries for vector database
            entries = []
            for i, (text, metadata) in enumerate(documents):
                entries.append((text, embeddings[i], metadata))
            
            # Add to vector database
            vector_ids = self.vector_db.add_vectors_batch(entries)
            
            logger.info(f"Added {len(vector_ids)} documents to knowledge base")
            return vector_ids
            
        except Exception as e:
            logger.error(f"Error adding documents batch: {str(e)}")
            raise
    
    def get_knowledge_base_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the knowledge base
        """
        return self.vector_db.get_stats()


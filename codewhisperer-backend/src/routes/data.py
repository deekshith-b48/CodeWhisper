from flask import Blueprint, request, jsonify
from src.services.rag_service import RAGService
from src.services.data_ingestion_service import DataIngestionService
from src.services.file_processing_service import FileProcessingService
from src.models.document import Document, DocumentChunk, db
import logging
import json
import os

logger = logging.getLogger(__name__)

data_bp = Blueprint('data', __name__)
rag_service = RAGService()
ingestion_service = DataIngestionService()
file_processor = FileProcessingService()

@data_bp.route('/ingest/code', methods=['POST'])
def ingest_code():
    """
    Ingest code files into the knowledge base
    """
    try:
        data = request.get_json()
        
        if not data or 'files' not in data:
            return jsonify({'error': 'Files data is required'}), 400
        
        files = data['files']
        repository = data.get('repository')
        branch = data.get('branch', 'main')
        commit_hash = data.get('commit_hash')
        
        processed_files = []
        total_chunks = 0
        
        for file_data in files:
            file_path = file_data.get('path')
            content = file_data.get('content')
            
            if not file_path or not content:
                continue
            
            # Process the code file
            chunks = ingestion_service.process_code_file(
                file_path, content, repository, branch, commit_hash
            )
            
            if chunks:
                # Add to knowledge base
                documents = [(chunk_text, metadata) for chunk_text, metadata in chunks]
                vector_ids = rag_service.add_documents_batch(documents)
                
                # Save to database
                doc = Document(
                    source_type='code',
                    source_url=f"file://{file_path}",
                    title=os.path.basename(file_path),
                    content=content,
                    doc_doc_metadata=json.dumps({
                        'repository': repository,
                        'branch': branch,
                        'commit_hash': commit_hash,
                        'language': ingestion_service._detect_language(os.path.splitext(file_path)[1])
                    }),
                    file_path=file_path,
                    repository=repository,
                    branch=branch,
                    commit_hash=commit_hash
                )
                db.session.add(doc)
                db.session.flush()
                
                # Save chunks
                for i, (chunk_text, metadata) in enumerate(chunks):
                    chunk = DocumentChunk(
                        document_id=doc.id,
                        chunk_text=chunk_text,
                        chunk_index=i,
                        embedding_id=vector_ids[i] if i < len(vector_ids) else None,
                        chunk_chunk_metadata=json.dumps(metadata)
                    )
                    db.session.add(chunk)
                
                processed_files.append({
                    'file_path': file_path,
                    'chunks_created': len(chunks)
                })
                total_chunks += len(chunks)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Processed {len(processed_files)} files with {total_chunks} chunks',
            'processed_files': processed_files
        })
        
    except Exception as e:
        logger.error(f"Error ingesting code: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@data_bp.route('/ingest/documentation', methods=['POST'])
def ingest_documentation():
    """
    Ingest documentation into the knowledge base
    """
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({'error': 'Content is required'}), 400
        
        content = data['content']
        title = data.get('title', 'Untitled Document')
        url = data.get('url')
        author = data.get('author')
        doc_type = data.get('doc_type', 'markdown')
        
        # Process the documentation
        chunks = ingestion_service.process_documentation(content, title, url, author, doc_type)
        
        if chunks:
            # Add to knowledge base
            documents = [(chunk_text, metadata) for chunk_text, metadata in chunks]
            vector_ids = rag_service.add_documents_batch(documents)
            
            # Save to database
            doc = Document(
                source_type='documentation',
                source_url=url or '',
                title=title,
                content=content,
                doc_doc_metadata=json.dumps({
                    'doc_type': doc_type,
                    'author': author
                }),
                author=author
            )
            db.session.add(doc)
            db.session.flush()
            
            # Save chunks
            for i, (chunk_text, metadata) in enumerate(chunks):
                chunk = DocumentChunk(
                    document_id=doc.id,
                    chunk_text=chunk_text,
                    chunk_index=i,
                    embedding_id=vector_ids[i] if i < len(vector_ids) else None,
                    chunk_metadata=json.dumps(metadata)
                )
                db.session.add(chunk)
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'Processed documentation with {len(chunks)} chunks',
                'document_id': doc.id,
                'chunks_created': len(chunks)
            })
        else:
            return jsonify({'error': 'No content could be processed'}), 400
        
    except Exception as e:
        logger.error(f"Error ingesting documentation: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@data_bp.route('/ingest/slack', methods=['POST'])
def ingest_slack():
    """
    Ingest Slack conversations into the knowledge base
    """
    try:
        data = request.get_json()
        
        if not data or 'messages' not in data:
            return jsonify({'error': 'Messages are required'}), 400
        
        messages = data['messages']
        channel = data.get('channel')
        
        # Process the Slack thread
        chunks = ingestion_service.process_slack_thread(messages, channel)
        
        if chunks:
            # Add to knowledge base
            documents = [(chunk_text, metadata) for chunk_text, metadata in chunks]
            vector_ids = rag_service.add_documents_batch(documents)
            
            # Save to database
            doc = Document(
                source_type='slack',
                source_url=f"slack://channel/{channel}" if channel else 'slack://unknown',
                title=f"Slack discussion in #{channel}" if channel else 'Slack conversation',
                content=json.dumps(messages),
                doc_metadata=json.dumps({
                    'channel': channel,
                    'message_count': len(messages)
                })
            )
            db.session.add(doc)
            db.session.flush()
            
            # Save chunks
            for i, (chunk_text, metadata) in enumerate(chunks):
                chunk = DocumentChunk(
                    document_id=doc.id,
                    chunk_text=chunk_text,
                    chunk_index=i,
                    embedding_id=vector_ids[i] if i < len(vector_ids) else None,
                    chunk_metadata=json.dumps(metadata)
                )
                db.session.add(chunk)
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'Processed Slack thread with {len(chunks)} chunks',
                'document_id': doc.id,
                'chunks_created': len(chunks)
            })
        else:
            return jsonify({'error': 'No content could be processed'}), 400
        
    except Exception as e:
        logger.error(f"Error ingesting Slack data: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@data_bp.route('/documents', methods=['GET'])
def list_documents():
    """
    List all documents in the knowledge base
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        source_type = request.args.get('source_type')
        
        query = Document.query
        if source_type:
            query = query.filter_by(source_type=source_type)
        
        documents = query.order_by(Document.created_at.desc())\
                        .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'documents': [doc.to_dict() for doc in documents.items],
            'total': documents.total,
            'pages': documents.pages,
            'current_page': page
        })
        
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@data_bp.route('/documents/<int:doc_id>', methods=['GET'])
def get_document(doc_id):
    """
    Get a specific document with its chunks
    """
    try:
        document = Document.query.get_or_404(doc_id)
        
        doc_data = document.to_dict()
        doc_data['chunks'] = [chunk.to_dict() for chunk in document.chunks]
        
        return jsonify(doc_data)
        
    except Exception as e:
        logger.error(f"Error getting document: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@data_bp.route('/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    """
    Delete a document and its chunks
    """
    try:
        document = Document.query.get_or_404(doc_id)
        
        # Delete from vector database
        for chunk in document.chunks:
            if chunk.embedding_id:
                rag_service.vector_db.delete_vector(chunk.embedding_id)
        
        # Delete from SQL database (chunks will be deleted by cascade)
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Document deleted successfully'})
        
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@data_bp.route('/supported-file-types', methods=['GET'])
def get_supported_file_types():
    """
    Get list of supported file types for upload
    """
    try:
        supported_extensions = file_processor.get_supported_extensions()
        
        # Group extensions by category
        categories = {
            'Text Files': ['txt', 'md', 'py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'h', 'sql', 'html', 'htm', 'xml', 'json', 'yaml', 'yml', 'sh', 'dockerfile'],
            'Documents': ['pdf', 'docx', 'doc'],
            'Spreadsheets': ['csv', 'xlsx', 'xls']
        }
        
        categorized_types = {}
        for category, extensions in categories.items():
            categorized_types[category] = [ext for ext in extensions if ext in supported_extensions]
        
        return jsonify({
            'supported_extensions': supported_extensions,
            'categorized_types': categorized_types,
            'total_supported': len(supported_extensions)
        })
        
    except Exception as e:
        logger.error(f"Error getting supported file types: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@data_bp.route('/stats', methods=['GET'])
def get_data_stats():
    """
    Get statistics about the knowledge base
    """
    try:
        # Get actual database statistics
        total_docs = Document.query.count()
        total_chunks = DocumentChunk.query.count()
        
        # Count by source type
        source_stats = db.session.query(
            Document.source_type,
            db.func.count(Document.id)
        ).group_by(Document.source_type).all()
        
        # Get vector database stats
        try:
            vector_stats = rag_service.get_knowledge_base_stats()
        except Exception as e:
            logger.warning(f"Could not get vector stats: {str(e)}")
            vector_stats = {
                'total_vectors': 0,
                'source_types': {},
                'storage_path': 'database/vectors.pkl'
            }
        
        return jsonify({
            'total_documents': total_docs,
            'total_chunks': total_chunks,
            'source_types': dict(source_stats),
            'vector_database': vector_stats,
            'status': 'ready'
        })
        
    except Exception as e:
        logger.error(f"Error getting data stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@data_bp.route('/ingest/document', methods=['POST'])
def ingest_document():
    """
    Ingest a single document into the knowledge base from the frontend
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Document text is required'}), 400
        
        text = data['text']
        metadata = data.get('metadata', {})
        
        # Add document to the RAG service
        vector_id = rag_service.add_document(text, metadata)
        
        # Also store in database for tracking
        document = Document(
            title=metadata.get('title', 'Untitled Document'),
            source_type=metadata.get('source_type', 'documentation'),
            content=text,  # Store full content
            source_url=metadata.get('source_url', ''),
            file_path=metadata.get('file_path', ''),
            repository=metadata.get('repository', ''),
            author=metadata.get('author', ''),
            doc_metadata=json.dumps(metadata)
        )
        
        db.session.add(document)
        db.session.commit()
        
        logger.info(f"Successfully ingested document: {metadata.get('title', 'Untitled')}")
        
        return jsonify({
            'success': True,
            'message': 'Document successfully ingested',
            'vector_id': vector_id,
            'document_id': document.id
        })
        
    except Exception as e:
        logger.error(f"Error ingesting document: {str(e)}")
        return jsonify({'error': 'Failed to ingest document'}), 500

@data_bp.route('/upload/file', methods=['POST'])
def upload_file():
    """
    Upload and process a file into the knowledge base
    """
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get metadata from form data
        title = request.form.get('title', file.filename)
        source_type = request.form.get('source_type', 'documentation')
        author = request.form.get('author', 'Unknown')
        tags = request.form.get('tags', '')
        
        # Check if file can be processed
        if not file_processor.can_process_file(file.filename):
            supported_extensions = file_processor.get_supported_extensions()
            return jsonify({
                'error': f'File type not supported. Supported types: {", ".join(supported_extensions)}'
            }), 400
        
        # Read file content
        file_content = file.read()
        
        # Process the file using the file processing service
        try:
            metadata = {
                'title': title,
                'source_type': source_type,
                'author': author,
                'tags': tags,
                'upload_method': 'file_upload'
            }
            
            content, file_metadata = file_processor.process_file(file_content, file.filename, metadata)
            
            if not content.strip():
                return jsonify({'error': 'File appears to be empty or could not be processed'}), 400
            
            # Add document to the RAG service
            vector_id = rag_service.add_document(content, file_metadata)
            
            # Store in database
            document = Document(
                title=title,
                source_type=source_type,
                content=content,
                source_url=f"file://{file.filename}",
                file_path=file.filename,
                author=author,
                doc_metadata=json.dumps(file_metadata)
            )
            
            db.session.add(document)
            db.session.commit()
            
            logger.info(f"Successfully uploaded and processed file: {file.filename}")
            
            return jsonify({
                'success': True,
                'message': f'File "{file.filename}" successfully uploaded and processed',
                'vector_id': vector_id,
                'document_id': document.id,
                'file_info': {
                    'filename': file.filename,
                    'size': len(content),
                    'extension': file_metadata.get('file_extension', ''),
                    'file_type': file_metadata.get('file_type', ''),
                    'processing_method': file_metadata.get('processing_method', '')
                }
            })
            
        except Exception as processing_error:
            logger.error(f"Error processing file {file.filename}: {str(processing_error)}")
            return jsonify({
                'error': f'Failed to process file: {str(processing_error)}',
                'filename': file.filename
            }), 500
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Failed to upload file: {str(e)}'}), 500
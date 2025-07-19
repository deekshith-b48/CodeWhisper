from flask import Blueprint, request, jsonify, current_app
from src.services.rag_service import RAGService
from src.models.document import UserQuery, db
import logging
import json

logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__)
rag_service = RAGService()

@chat_bp.route('/query', methods=['POST'])
def process_query():
    """
    Process a user query using RAG
    """
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400
        
        user_query = data['query']
        user_id = data.get('user_id', 'anonymous')
        source_type_filter = data.get('source_type_filter')
        
        # Process the query
        result = rag_service.query(user_query, source_type_filter)
        
        # Save query to database
        try:
            with current_app.app_context():
                query_record = UserQuery(
                    user_id=user_id,
                    query_text=user_query,
                    response_text=result['response'],
                    sources_used=json.dumps([source['title'] for source in result['sources']]),
                    processing_time=result['processing_time']
                )
                db.session.add(query_record)
                db.session.commit()
        except Exception as e:
            logger.error(f"Error saving query to database: {str(e)}")
        
        return jsonify({
            'success': result['success'],
            'response': result['response'],
            'sources': result['sources'],
            'processing_time': result['processing_time'],
            'context_used': result['context_used']
        })
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@chat_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    """
    Submit feedback for a query response
    """
    try:
        data = request.get_json()
        
        if not data or 'query_id' not in data:
            return jsonify({'error': 'Query ID is required'}), 400
        
        query_id = data['query_id']
        rating = data.get('rating')
        feedback_text = data.get('feedback_text')
        
        # Find and update the query record
        query_record = UserQuery.query.get(query_id)
        if not query_record:
            return jsonify({'error': 'Query not found'}), 404
        
        query_record.feedback_rating = rating
        query_record.feedback_text = feedback_text
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Feedback submitted successfully'})
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@chat_bp.route('/history/<user_id>', methods=['GET'])
def get_user_history(user_id):
    """
    Get query history for a user
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        queries = UserQuery.query.filter_by(user_id=user_id)\
                                 .order_by(UserQuery.created_at.desc())\
                                 .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'queries': [query.to_dict() for query in queries.items],
            'total': queries.total,
            'pages': queries.pages,
            'current_page': page
        })
        
    except Exception as e:
        logger.error(f"Error getting user history: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@chat_bp.route('/stats', methods=['GET'])
def get_chat_stats():
    """
    Get chat statistics
    """
    try:
        total_queries = UserQuery.query.count()
        avg_rating = db.session.query(db.func.avg(UserQuery.feedback_rating))\
                              .filter(UserQuery.feedback_rating.isnot(None)).scalar()
        avg_processing_time = db.session.query(db.func.avg(UserQuery.processing_time)).scalar()
        
        # Get knowledge base stats
        kb_stats = rag_service.get_knowledge_base_stats()
        
        return jsonify({
            'total_queries': total_queries,
            'average_rating': round(avg_rating, 2) if avg_rating else None,
            'average_processing_time': round(avg_processing_time, 3) if avg_processing_time else None,
            'knowledge_base': kb_stats
        })
        
    except Exception as e:
        logger.error(f"Error getting chat stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    source_type = db.Column(db.String(50), nullable=False)  # 'code', 'documentation', 'slack'
    source_url = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text, nullable=False)
    doc_metadata = db.Column(db.Text)  # JSON string for flexible metadata
    author = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    file_path = db.Column(db.String(1000))
    repository = db.Column(db.String(255))
    branch = db.Column(db.String(100))
    commit_hash = db.Column(db.String(40))
    
    # Relationships
    chunks = db.relationship('DocumentChunk', backref='document', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'source_type': self.source_type,
            'source_url': self.source_url,
            'title': self.title,
            'metadata': json.loads(self.doc_metadata) if self.doc_metadata else {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'file_path': self.file_path,
            'repository': self.repository,
            'branch': self.branch,
            'commit_hash': self.commit_hash
        }

class DocumentChunk(db.Model):
    __tablename__ = 'document_chunks'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    chunk_text = db.Column(db.Text, nullable=False)
    chunk_index = db.Column(db.Integer, nullable=False)
    embedding_id = db.Column(db.String(100))  # Reference to vector database
    chunk_metadata = db.Column(db.Text)  # JSON string for chunk-specific metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'document_id': self.document_id,
            'chunk_text': self.chunk_text,
            'chunk_index': self.chunk_index,
            'embedding_id': self.embedding_id,
            'metadata': json.loads(self.chunk_metadata) if self.chunk_metadata else {},
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UserQuery(db.Model):
    __tablename__ = 'user_queries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False)
    query_text = db.Column(db.Text, nullable=False)
    response_text = db.Column(db.Text)
    sources_used = db.Column(db.Text)  # JSON array of source document IDs
    feedback_rating = db.Column(db.Integer)  # 1-5 rating
    feedback_text = db.Column(db.Text)
    processing_time = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'query_text': self.query_text,
            'response_text': self.response_text,
            'sources_used': json.loads(self.sources_used) if self.sources_used else [],
            'feedback_rating': self.feedback_rating,
            'feedback_text': self.feedback_text,
            'processing_time': self.processing_time,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


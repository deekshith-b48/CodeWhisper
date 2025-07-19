#!/usr/bin/env python3
"""
Demo data script to populate CodeWhisperer knowledge base with sample content
"""

import os
import sys
import json
from datetime import datetime

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.services.rag_service import RAGService
from src.services.data_ingestion_service import DataIngestionService
from src.models.document import Document, DocumentChunk, db
from src.main import app

def create_sample_code_files():
    """Create sample code files for demonstration"""
    code_samples = [
        {
            "path": "src/utils/auth.py",
            "content": """
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app

def generate_token(user_id, email):
    \"\"\"
    Generate JWT token for user authentication
    
    Args:
        user_id (str): Unique user identifier
        email (str): User email address
    
    Returns:
        str: JWT token
    \"\"\"
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    \"\"\"
    Verify JWT token and extract user information
    
    Args:
        token (str): JWT token to verify
    
    Returns:
        dict: User information if valid, None otherwise
    \"\"\"
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    \"\"\"
    Decorator to require authentication for API endpoints
    \"\"\"
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_info = verify_token(token)
        if not user_info:
            return jsonify({'error': 'Invalid token'}), 401
        
        request.user = user_info
        return f(*args, **kwargs)
    
    return decorated_function
""",
            "repository": "codewhisperer-backend",
            "branch": "main"
        },
        {
            "path": "src/api/user_routes.py",
            "content": """
from flask import Blueprint, request, jsonify
from src.models.user import User, db
from src.utils.auth import generate_token, require_auth
import bcrypt

user_bp = Blueprint('user', __name__)

@user_bp.route('/register', methods=['POST'])
def register():
    \"\"\"
    Register a new user account
    \"\"\"
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'User already exists'}), 409
    
    # Hash password
    password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    
    # Create new user
    user = User(
        email=data['email'],
        password_hash=password_hash.decode('utf-8'),
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Generate token
    token = generate_token(str(user.id), user.email)
    
    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': user.to_dict()
    }), 201

@user_bp.route('/login', methods=['POST'])
def login():
    \"\"\"
    Authenticate user and return JWT token
    \"\"\"
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    # Find user
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Verify password
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate token
    token = generate_token(str(user.id), user.email)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    })

@user_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    \"\"\"
    Get current user profile
    \"\"\"
    user = User.query.get(request.user['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict())
""",
            "repository": "codewhisperer-backend",
            "branch": "main"
        },
        {
            "path": "frontend/src/components/Dashboard.jsx",
            "content": """
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, MessageSquare, Database, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQueries: 0,
    totalDocuments: 0,
    avgResponseTime: 0
  });
  const [queryData, setQueryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats from multiple endpoints
      const [chatStats, dataStats] = await Promise.all([
        fetch('/api/chat/stats').then(res => res.json()),
        fetch('/api/data/stats').then(res => res.json())
      ]);
      
      setStats({
        totalUsers: 150, // Mock data
        totalQueries: chatStats.total_queries || 0,
        totalDocuments: dataStats.total_documents || 0,
        avgResponseTime: chatStats.average_processing_time || 0
      });
      
      // Mock query data for chart
      setQueryData([
        { name: 'Mon', queries: 45 },
        { name: 'Tue', queries: 52 },
        { name: 'Wed', queries: 38 },
        { name: 'Thu', queries: 61 },
        { name: 'Fri', queries: 55 },
        { name: 'Sat', queries: 23 },
        { name: 'Sun', queries: 18 }
      ]);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, suffix = '' }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : value}{suffix}
            </p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of CodeWhisperer usage and performance</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Queries"
          value={stats.totalQueries}
          icon={MessageSquare}
          color="bg-green-500"
        />
        <StatCard
          title="Documents"
          value={stats.totalDocuments}
          icon={Database}
          color="bg-purple-500"
        />
        <StatCard
          title="Avg Response Time"
          value={stats.avgResponseTime.toFixed(2)}
          icon={TrendingUp}
          color="bg-orange-500"
          suffix="s"
        />
      </div>
      
      {/* Query Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Query Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={queryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="queries" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
""",
            "repository": "codewhisperer-frontend",
            "branch": "main"
        }
    ]
    
    return code_samples

def create_sample_documentation():
    """Create sample documentation for demonstration"""
    docs = [
        {
            "title": "CodeWhisperer Setup Guide",
            "content": """# CodeWhisperer Setup Guide

## Overview
CodeWhisperer is an AI-powered developer onboarding assistant designed to help new team members quickly understand codebases, documentation, and internal processes.

## Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- OpenAI API key

## Installation

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/company/codewhisperer-backend.git
   cd codewhisperer-backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set environment variables:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   export FLASK_ENV="development"
   ```

5. Initialize database:
   ```bash
   python -c "from src.main import app, db; app.app_context().push(); db.create_all()"
   ```

6. Run the application:
   ```bash
   python src/main.py
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd ../codewhisperer-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key for AI functionality
- `SECRET_KEY`: Flask secret key for session management
- `DATABASE_URL`: Database connection string (optional, defaults to SQLite)

### Data Ingestion
To populate the knowledge base with your data:

1. **Code Repositories**: Use the `/api/data/ingest/code` endpoint
2. **Documentation**: Use the `/api/data/ingest/documentation` endpoint  
3. **Slack Conversations**: Use the `/api/data/ingest/slack` endpoint

## Usage

### Basic Queries
- "How do I set up the development environment?"
- "What is the authentication flow?"
- "Where is the user registration logic?"
- "How do I deploy the application?"

### Advanced Features
- Filter by source type (code, documentation, slack)
- View source citations for all responses
- Provide feedback on answer quality
- Browse and manage knowledge base

## Troubleshooting

### Common Issues
1. **API Key Error**: Ensure OPENAI_API_KEY is set correctly
2. **Database Connection**: Check database permissions and connection string
3. **CORS Issues**: Verify CORS is enabled for frontend domain
4. **Memory Issues**: Increase available memory for large knowledge bases

### Performance Optimization
- Use appropriate chunk sizes for different content types
- Implement caching for frequently accessed data
- Monitor API usage and rate limits
- Regular database maintenance and cleanup

## Support
For technical support, contact the development team or create an issue in the repository.
""",
            "url": "https://docs.company.com/codewhisperer/setup",
            "author": "DevOps Team"
        },
        {
            "title": "API Documentation",
            "content": """# CodeWhisperer API Documentation

## Authentication
All API endpoints require authentication using JWT tokens.

### Login
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@company.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

## Chat Endpoints

### Query AI Assistant
```http
POST /api/chat/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "How do I implement authentication?",
  "user_id": "user123",
  "source_type_filter": "code"
}
```

Response:
```json
{
  "success": true,
  "response": "To implement authentication, you can use the auth utility...",
  "sources": [
    {
      "title": "Authentication Utility",
      "source_type": "code",
      "similarity": 0.95,
      "preview": "JWT token generation and verification..."
    }
  ],
  "processing_time": 1.23,
  "context_used": 5
}
```

### Submit Feedback
```http
POST /api/chat/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "query_id": 123,
  "rating": 5,
  "feedback_text": "Very helpful response"
}
```

## Data Management Endpoints

### Ingest Code Files
```http
POST /api/data/ingest/code
Authorization: Bearer <token>
Content-Type: application/json

{
  "files": [
    {
      "path": "src/utils/auth.py",
      "content": "import jwt\\nfrom datetime import datetime..."
    }
  ],
  "repository": "codewhisperer-backend",
  "branch": "main",
  "commit_hash": "abc123"
}
```

### Ingest Documentation
```http
POST /api/data/ingest/documentation
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Setup Guide",
  "content": "# Setup Guide\\n\\nThis guide explains...",
  "url": "https://docs.company.com/setup",
  "author": "DevOps Team",
  "doc_type": "markdown"
}
```

### List Documents
```http
GET /api/data/documents?page=1&per_page=20&source_type=code
Authorization: Bearer <token>
```

## Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes
- `401`: Unauthorized - Invalid or missing token
- `400`: Bad Request - Invalid request data
- `404`: Not Found - Resource not found
- `429`: Rate Limited - Too many requests
- `500`: Internal Server Error - Server error

## Rate Limiting
- Chat queries: 100 requests per hour per user
- Data ingestion: 50 requests per hour per user
- General API: 1000 requests per hour per user

## Webhooks
Configure webhooks to automatically ingest data from external sources:

### GitHub Integration
```http
POST /api/webhooks/github
Content-Type: application/json
X-GitHub-Event: push

{
  "repository": {
    "name": "codewhisperer-backend",
    "full_name": "company/codewhisperer-backend"
  },
  "commits": [...]
}
```

### Slack Integration
```http
POST /api/webhooks/slack
Content-Type: application/json
X-Slack-Signature: v0=...

{
  "event": {
    "type": "message",
    "channel": "C1234567890",
    "text": "How do we handle user authentication?"
  }
}
```
""",
            "url": "https://docs.company.com/codewhisperer/api",
            "author": "API Team"
        }
    ]
    
    return docs

def create_sample_slack_conversations():
    """Create sample Slack conversations for demonstration"""
    conversations = [
        {
            "channel": "engineering",
            "messages": [
                {
                    "user": "john.doe",
                    "text": "Hey team, I'm having trouble setting up the development environment. The database connection keeps failing.",
                    "ts": "1640995200.000100"
                },
                {
                    "user": "jane.smith",
                    "text": "Did you set the DATABASE_URL environment variable? It should point to your local PostgreSQL instance.",
                    "ts": "1640995260.000200"
                },
                {
                    "user": "john.doe",
                    "text": "I'm using SQLite for local development. Should I still set DATABASE_URL?",
                    "ts": "1640995320.000300"
                },
                {
                    "user": "mike.wilson",
                    "text": "For SQLite, you can leave DATABASE_URL unset and it will default to the SQLite file in the database folder. Make sure you've run the database initialization script first.",
                    "ts": "1640995380.000400"
                },
                {
                    "user": "john.doe",
                    "text": "That worked! Thanks everyone. The app is running now.",
                    "ts": "1640995440.000500"
                }
            ]
        },
        {
            "channel": "frontend",
            "messages": [
                {
                    "user": "sarah.jones",
                    "text": "What's the best way to handle API errors in our React components?",
                    "ts": "1641081600.000100"
                },
                {
                    "user": "alex.brown",
                    "text": "We have a custom hook called useApiError that handles common error scenarios. It's in src/hooks/useApiError.js",
                    "ts": "1641081660.000200"
                },
                {
                    "user": "sarah.jones",
                    "text": "Perfect! I see it handles 401 errors by redirecting to login. What about 500 errors?",
                    "ts": "1641081720.000300"
                },
                {
                    "user": "alex.brown",
                    "text": "500 errors show a toast notification and log the error to our monitoring service. You can customize the behavior by passing options to the hook.",
                    "ts": "1641081780.000400"
                }
            ]
        }
    ]
    
    return conversations

def populate_knowledge_base():
    """Populate the knowledge base with sample data"""
    print("Initializing CodeWhisperer knowledge base with demo data...")
    
    rag_service = RAGService()
    ingestion_service = DataIngestionService()
    
    # Create sample code files
    print("Adding code files...")
    code_files = create_sample_code_files()
    for file_data in code_files:
        try:
            chunks = ingestion_service.process_code_file(
                file_data["path"],
                file_data["content"],
                file_data.get("repository"),
                file_data.get("branch", "main")
            )
            
            if chunks:
                documents = [(chunk_text, metadata) for chunk_text, metadata in chunks]
                vector_ids = rag_service.add_documents_batch(documents)
                print(f"  ✓ Added {file_data['path']} with {len(chunks)} chunks")
            
        except Exception as e:
            print(f"  ✗ Error processing {file_data['path']}: {str(e)}")
    
    # Create sample documentation
    print("Adding documentation...")
    docs = create_sample_documentation()
    for doc_data in docs:
        try:
            chunks = ingestion_service.process_documentation(
                doc_data["content"],
                doc_data["title"],
                doc_data.get("url"),
                doc_data.get("author")
            )
            
            if chunks:
                documents = [(chunk_text, metadata) for chunk_text, metadata in chunks]
                vector_ids = rag_service.add_documents_batch(documents)
                print(f"  ✓ Added '{doc_data['title']}' with {len(chunks)} chunks")
            
        except Exception as e:
            print(f"  ✗ Error processing '{doc_data['title']}': {str(e)}")
    
    # Create sample Slack conversations
    print("Adding Slack conversations...")
    conversations = create_sample_slack_conversations()
    for conv_data in conversations:
        try:
            chunks = ingestion_service.process_slack_thread(
                conv_data["messages"],
                conv_data["channel"]
            )
            
            if chunks:
                documents = [(chunk_text, metadata) for chunk_text, metadata in chunks]
                vector_ids = rag_service.add_documents_batch(documents)
                print(f"  ✓ Added #{conv_data['channel']} conversation with {len(chunks)} chunks")
            
        except Exception as e:
            print(f"  ✗ Error processing #{conv_data['channel']} conversation: {str(e)}")
    
    # Get final stats
    stats = rag_service.get_knowledge_base_stats()
    print(f"\\n✅ Knowledge base populated successfully!")
    print(f"   Total vectors: {stats.get('total_vectors', 0)}")
    print(f"   Source types: {stats.get('source_types', {})}")

if __name__ == "__main__":
    with app.app_context():
        populate_knowledge_base()


# CodeWhisperer - Full-Stack AI Developer Onboarding Assistant

## 🚀 Project Overview

CodeWhisperer is a comprehensive full-stack web application that serves as an AI-powered developer onboarding assistant. It helps new team members quickly understand codebases, documentation, and internal processes through intelligent chat interactions and knowledge base management.

## 🏗️ Architecture

### Backend (Flask)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (easily configurable for PostgreSQL/MySQL)
- **AI Integration**: Google Gemini models with RAG (Retrieval-Augmented Generation)
- **Vector Database**: In-memory vector storage with similarity search
- **API**: RESTful API with CORS support

### Frontend (React)
- **Framework**: React 18 with Vite
- **UI Components**: Shadcn/ui with Tailwind CSS
- **State Management**: React hooks and context
- **Responsive Design**: Mobile and desktop optimized

### Key Features
- **Intelligent Chat Interface**: AI-powered responses with source citations
- **Knowledge Base Management**: Ingest code, documentation, and Slack conversations
- **Multi-source Search**: Filter by source type (code, documentation, Slack)
- **Real-time Processing**: Live chat with typing indicators
- **Source Attribution**: View original sources for AI responses

## 📁 Project Structure

```
codewhisperer-backend/
├── src/
│   ├── main.py                 # Flask application entry point
│   ├── models/
│   │   └── document.py         # Database models
│   ├── routes/
│   │   ├── chat.py            # Chat API endpoints
│   │   └── data.py            # Data ingestion endpoints
│   ├── services/
│   │   ├── rag_service.py     # RAG implementation
│   │   ├── vector_db_service.py # Vector database
│   │   ├── embedding_service.py # Text embeddings
│   │   ├── mock_embedding_service.py # Demo embeddings
│   │   └── data_ingestion_service.py # Data processing
│   ├── static/                # Frontend build files
│   └── demo_data.py           # Sample data population
├── requirements.txt           # Python dependencies
└── venv/                     # Virtual environment

codewhisperer-frontend/
├── src/
│   ├── App.jsx               # Main application component
│   ├── components/
│   │   ├── ChatInterface.jsx # Chat UI component
│   │   └── KnowledgeBase.jsx # Knowledge base management
│   └── components/ui/        # Shadcn UI components
├── dist/                     # Built frontend files
├── package.json             # Node.js dependencies
└── vite.config.js           # Vite configuration
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- Gemini API key (optional - demo uses mock embeddings)

### Backend Setup

1. **Clone and navigate to backend directory**:
   ```bash
   cd codewhisperer-backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Gemini API (Interactive)**:
   ```bash
   python setup_gemini.py
   ```
   
   **Or set environment variables manually**:
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key-here"
   export FLASK_ENV="development"
   ```

   **Get your Gemini API key**:
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

5. **Initialize database and populate with demo data**:
   ```bash
   python -c "from src.main import app, db; app.app_context().push(); db.create_all()"
   python src/demo_data.py
   ```

6. **Run the backend server**:
   ```bash
   python src/main.py
   ```
   The backend will be available at `http://localhost:5002`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd codewhisperer-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Copy build files to Flask static directory**:
   ```bash
   cp -r dist/* ../codewhisperer-backend/src/static/
   ```

## 🚀 Deployment Options

### Option 1: Local Development
- Follow the installation steps above
- Access the application at `http://localhost:5002`

### Option 2: Production Deployment

#### Using Docker (Recommended)

1. **Create Dockerfile for backend**:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY src/ ./src/
   EXPOSE 5000
   CMD ["python", "src/main.py"]
   ```

2. **Build and run**:
   ```bash
   docker build -t codewhisperer .
   docker run -p 5000:5000 -e OPENAI_API_KEY="your-key" codewhisperer
   ```

#### Using Cloud Platforms

**Heroku**:
1. Create `Procfile`: `web: python src/main.py`
2. Set environment variables in Heroku dashboard
3. Deploy using Git or Heroku CLI

**AWS/GCP/Azure**:
- Use their respective app service platforms
- Configure environment variables
- Set up database (PostgreSQL recommended for production)

## 🔧 Configuration

### Environment Variables
- `GEMINI_API_KEY`: Your Google Gemini API key for AI functionality
- `SECRET_KEY`: Flask secret key for session management
- `DATABASE_URL`: Database connection string (optional, defaults to SQLite)
- `FLASK_ENV`: Set to "production" for production deployment

### Database Configuration
The application uses SQLite by default. For production, configure PostgreSQL:

```python
# In src/main.py
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///codewhisperer.db')
```

## 📊 API Documentation

### Authentication
All API endpoints support JWT token authentication (implementation ready).

### Chat Endpoints

#### Query AI Assistant
```http
POST /api/chat/query
Content-Type: application/json

{
  "query": "How do I implement authentication?",
  "user_id": "user123",
  "source_type_filter": "code"
}
```

**Response**:
```json
{
  "success": true,
  "response": "To implement authentication...",
  "sources": [
    {
      "title": "Authentication Utility",
      "source_type": "code",
      "similarity": 0.95,
      "preview": "JWT token generation..."
    }
  ],
  "processing_time": 1.23,
  "context_used": 5
}
```

### Data Management Endpoints

#### Ingest Code Files
```http
POST /api/data/ingest/code
Content-Type: application/json

{
  "files": [
    {
      "path": "src/utils/auth.py",
      "content": "import jwt..."
    }
  ],
  "repository": "my-repo",
  "branch": "main"
}
```

#### Ingest Documentation
```http
POST /api/data/ingest/documentation
Content-Type: application/json

{
  "title": "Setup Guide",
  "content": "# Setup Guide...",
  "url": "https://docs.company.com/setup",
  "author": "DevOps Team"
}
```

## 🎯 Usage Examples

### Basic Queries
- "How do I set up the development environment?"
- "What is the authentication flow?"
- "Where is the user registration logic?"
- "How do I deploy the application?"

### Advanced Features
- Filter responses by source type (code, documentation, Slack)
- View source citations for all responses
- Provide feedback on answer quality
- Browse and manage knowledge base content

## 🔒 Security Considerations

### Production Checklist
- [ ] Set strong `SECRET_KEY` environment variable
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Use production database (PostgreSQL)
- [ ] Enable logging and monitoring
- [ ] Secure API keys and environment variables

### Authentication Flow
- JWT token-based authentication
- Secure password hashing with bcrypt
- Token expiration and refresh mechanisms
- Protected API endpoints

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**: Ensure OPENAI_API_KEY is set correctly
2. **Database Connection**: Check database permissions and connection string
3. **CORS Issues**: Verify CORS is enabled for frontend domain
4. **Memory Issues**: Increase available memory for large knowledge bases
5. **Port Conflicts**: Change port in `src/main.py` if 5002 is in use

### Performance Optimization
- Use appropriate chunk sizes for different content types
- Implement caching for frequently accessed data
- Monitor API usage and rate limits
- Regular database maintenance and cleanup

## 📈 Monitoring & Analytics

### Key Metrics to Track
- Query response times
- User engagement rates
- Knowledge base coverage
- API usage patterns
- Error rates and types

### Logging
The application includes comprehensive logging:
- Request/response logging
- Error tracking
- Performance metrics
- User interaction analytics

## 🔄 Maintenance

### Regular Tasks
- Update knowledge base with new content
- Monitor and rotate API keys
- Database backups and maintenance
- Security updates and patches
- Performance monitoring and optimization

### Scaling Considerations
- Implement Redis for caching
- Use load balancers for multiple instances
- Consider microservices architecture for large deployments
- Implement proper database indexing

## 📞 Support

For technical support or questions:
1. Check the troubleshooting section above
2. Review API documentation for endpoint details
3. Examine application logs for error details
4. Contact the development team for assistance

## 🎉 Demo Data

The application comes pre-populated with sample data including:
- **Code Files**: Authentication utilities, API routes, React components
- **Documentation**: Setup guides, API documentation, troubleshooting guides
- **Slack Conversations**: Developer discussions and Q&A sessions

This demo data allows immediate testing of all features without requiring real data ingestion.

---

**Built with ❤️ using Flask, React, and OpenAI**


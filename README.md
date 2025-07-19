# CodeWhisperer - AI-Powered Developer Onboarding Assistant

A comprehensive AI-powered application designed to streamline developer onboarding through intelligent document management, knowledge base creation, and conversational AI assistance with citation tracking.

## 🚀 Current Status

**✅ FULLY FUNCTIONAL** - The application is now running successfully with all core features working:

- **Frontend**: Running on http://localhost:5176/
- **Backend API**: Running on http://localhost:5002/
- **Neo Brutalism UI**: Complete with modern design and animations
- **Chat Interface**: Working with Perplexity-style citations
- **Knowledge Base**: Document management and browsing
- **Document Upload**: Admin functionality for knowledge base management

## 🎯 Key Features

### 🤖 **AI Chat with Citations**
- **Perplexity-style responses** with numbered source citations
- **Source filtering** by document type (code, documentation, slack)
- **Copy functionality** for responses and source links
- **Feedback system** for response quality
- **Real-time processing** with loading states

### 📚 **Knowledge Base Management**
- **Document upload** for admins (text, markdown, code files)
- **Metadata management** (title, author, tags, source type)
- **Document browsing** with search and filtering
- **Statistics dashboard** showing knowledge base metrics
- **Source type organization** (documentation, code, slack)

### 🎨 **Neo Brutalism Design**
- **Bold borders** and high contrast design
- **Interactive animations** with hover effects
- **Modern UI components** using Radix UI
- **Responsive layout** for all screen sizes
- **Consistent theming** throughout the application

### 🔐 **Role-Based Access**
- **Admin role**: Full access to document upload and management
- **Joinee role**: Access to chat interface and knowledge base browsing
- **Secure API endpoints** with proper authentication structure

## 🏗️ Architecture

### **Frontend (React + Vite)**
```
codewhisperer-frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ChatInterface.jsx    # Main chat UI
│   │   ├── KnowledgeBase.jsx    # Document browsing
│   │   ├── KnowledgeUpload.jsx  # Document upload
│   │   └── ui/              # Radix UI components
│   ├── lib/
│   │   └── api.ts          # API client
│   └── index.css           # Neo brutalism styles
```

### **Backend (Flask + Python)**
```
codewhisperer-backend/
├── src/
│   ├── routes/             # API endpoints
│   │   ├── chat.py         # Chat functionality
│   │   ├── data.py         # Document management
│   │   └── user.py         # User management
│   ├── services/           # Business logic
│   │   ├── rag_service.py      # RAG implementation
│   │   ├── embedding_service.py # Vector embeddings
│   │   └── vector_db_service.py # Vector database
│   └── models/             # Database models
```

## 🚀 Quick Start

### **Prerequisites**
- Python 3.8+
- Node.js 16+
- pnpm (recommended) or npm

### **1. Start the Backend**
```bash
cd codewhisperer-backend
pip install flask flask-cors Flask-SQLAlchemy requests numpy scikit-learn scipy joblib tqdm pydantic google-generativeai==0.1.0rc1
python -m src.main
```

### **2. Start the Frontend**
```bash
cd codewhisperer-frontend
pnpm install
pnpm dev
```

### **3. Access the Application**
- **Frontend**: http://localhost:5176/
- **Backend API**: http://localhost:5002/
- **API Health Check**: http://localhost:5002/health

## 📖 Usage Guide

### **For Admins**
1. **Upload Documents**: Use the "Knowledge Upload" tab to add documents to the knowledge base
2. **Manage Content**: Browse and manage existing documents in the "Knowledge Base" tab
3. **Monitor Usage**: Check statistics and usage patterns

### **For Joinees**
1. **Ask Questions**: Use the chat interface to ask questions about the codebase
2. **Browse Knowledge**: Explore the knowledge base to find relevant documentation
3. **Get Citations**: All responses include source citations for transparency

### **Chat Features**
- **Source Filtering**: Filter responses by document type
- **Copy Responses**: Copy chat responses to clipboard
- **Source Links**: Access original source documents
- **Feedback**: Rate response quality to improve the system

## 🔧 API Endpoints

### **Chat Endpoints**
- `POST /api/chat/query` - Send a chat message
- `GET /api/chat/history` - Get chat history

### **Data Endpoints**
- `GET /api/data/stats` - Get knowledge base statistics
- `GET /api/data/documents` - List all documents
- `POST /api/data/ingest/document` - Upload a document

### **User Endpoints**
- `POST /api/user/login` - User authentication
- `GET /api/user/profile` - Get user profile

## 🎨 Design System

### **Neo Brutalism Theme**
- **Colors**: High contrast with bold blacks and bright accents
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Generous padding and margins for readability
- **Animations**: Subtle hover effects and transitions
- **Borders**: Thick, bold borders for visual impact

### **Components**
- **Cards**: Elevated with shadows and borders
- **Buttons**: Bold, high-contrast with hover effects
- **Inputs**: Clean, bordered with focus states
- **Chat Bubbles**: Distinct styling for user vs bot messages

## 🔮 Future Enhancements

### **Planned Features**
- [ ] **Voice Input**: Speech-to-text for chat interface
- [ ] **File Upload**: Direct file upload support
- [ ] **Advanced Search**: Semantic search with filters
- [ ] **Analytics Dashboard**: Detailed usage analytics
- [ ] **Multi-language Support**: Internationalization
- [ ] **Mobile App**: Native mobile application

### **Technical Improvements**
- [ ] **Caching**: Redis integration for performance
- [ ] **Rate Limiting**: API rate limiting and protection
- [ ] **Monitoring**: Application monitoring and logging
- [ ] **Testing**: Comprehensive test suite
- [ ] **CI/CD**: Automated deployment pipeline

## 🛠️ Development

### **Frontend Development**
```bash
cd codewhisperer-frontend
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
```

### **Backend Development**
```bash
cd codewhisperer-backend
python -m src.main    # Start development server
```

### **Database Management**
```bash
# The SQLite database is automatically created
# Location: codewhisperer-backend/src/database/app.db
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the knowledge base
- Review the API documentation

---

**CodeWhisperer** - Making developer onboarding seamless and intelligent! 🚀 # CodeWhisper

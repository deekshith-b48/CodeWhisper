# CodeWhisperer Deployment Guide

This guide will help you deploy the CodeWhisperer application to your preferred hosting platform.

## 🚀 Quick Deployment Options

### Option 1: Local Development
```bash
# Clone the repository
git clone https://github.com/deekshith-b48/CodeWhisper.git
cd CodeWhisper

# Start Backend
cd codewhisperer-backend
pip install -r requirements.txt
python -m src.main

# Start Frontend (in new terminal)
cd codewhisperer-frontend
pnpm install
pnpm dev
```

### Option 2: Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Option 3: Cloud Deployment

#### Heroku
```bash
# Deploy to Heroku
heroku create your-codewhisperer-app
git push heroku main
```

#### Vercel (Frontend)
```bash
# Deploy frontend to Vercel
cd codewhisperer-frontend
vercel --prod
```

#### Railway
```bash
# Deploy to Railway
railway login
railway init
railway up
```

## 🔧 Environment Setup

### Required Environment Variables
```env
# Backend (.env file)
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///src/database/app.db
FLASK_ENV=production

# Frontend (.env file)
VITE_API_BASE_URL=http://localhost:5002/api
```

### API Keys Setup
1. **Google Gemini API**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Database**: SQLite is used by default, but you can switch to PostgreSQL for production

## 📦 Production Build

### Frontend Build
```bash
cd codewhisperer-frontend
pnpm build
# The built files will be in the dist/ directory
```

### Backend Setup
```bash
cd codewhisperer-backend
pip install -r requirements.txt
# Use gunicorn for production
gunicorn -w 4 -b 0.0.0.0:5002 src.main:app
```

## 🌐 Domain Configuration

### CORS Settings
Update the CORS configuration in `codewhisperer-backend/src/main.py`:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://yourdomain.com", "http://localhost:5176"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

### API Base URL
Update the API base URL in `codewhisperer-frontend/src/lib/api.ts`:
```typescript
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

## 🔒 Security Considerations

### Production Checklist
- [ ] Set strong SECRET_KEY
- [ ] Configure HTTPS
- [ ] Set up proper CORS origins
- [ ] Use environment variables for sensitive data
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure database backups

### SSL/HTTPS Setup
```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring

### Health Checks
- Backend: `GET /health`
- Frontend: Check if the app loads correctly

### Logging
```python
# Add to main.py for production logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(module)s | %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy CodeWhisperer

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          # Your deployment commands here
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration in backend
   - Verify frontend API base URL

2. **Database Issues**
   - Ensure database directory exists
   - Check file permissions

3. **API Key Issues**
   - Verify GEMINI_API_KEY is set
   - Check API key permissions

4. **Port Conflicts**
   - Change ports in configuration files
   - Check if ports are already in use

### Debug Mode
```bash
# Enable debug mode for development
export FLASK_ENV=development
export FLASK_DEBUG=1
```

## 📞 Support

For deployment issues:
1. Check the logs for error messages
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check network connectivity and firewall settings

---

**Happy Deploying! 🚀** 
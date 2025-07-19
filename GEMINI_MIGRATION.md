# 🔄 Migration from OpenAI to Gemini API

This document outlines the changes made to migrate CodeWhisperer from OpenAI to Google Gemini API.

## 📋 What Changed

### 1. **New Dependencies**
- Added `google-generativeai==0.8.3` to `requirements.txt`
- Removed dependency on OpenAI for embeddings and chat completions

### 2. **New Services**
- **`src/services/gemini_embedding_service.py`**: New Gemini-based embedding service
- **Modified `src/services/rag_service.py`**: Updated to use Gemini for chat completions

### 3. **Environment Variables**
- **Old**: `OPENAI_API_KEY`
- **New**: `GEMINI_API_KEY`

### 4. **Models Used**
- **Embeddings**: `models/embedding-001` (Gemini)
- **Chat Completions**: `gemini-1.5-flash` (Gemini)

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd codewhisperer-backend
pip install -r requirements.txt
```

### 2. Get Gemini API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create a new API key
4. Copy the key

### 3. Set Environment Variable
```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

### 4. Test Setup (Optional)
```bash
python setup_gemini.py
```

### 5. Run the Application
```bash
python src/main.py
```

## 🔧 Technical Details

### Embedding Service
- **Model**: `models/embedding-001`
- **Dimension**: 768 (Gemini) vs 1536 (OpenAI)
- **Max tokens**: 2048
- **Fallback**: Mock embedding service when no API key

### Chat Completions
- **Model**: `gemini-1.5-flash`
- **Temperature**: 0.7
- **Max tokens**: 1500
- **Features**: Context-aware responses with source citations

### Backward Compatibility
- ✅ Mock embedding service still available for demo
- ✅ Graceful fallback when API key not provided
- ✅ Same API endpoints and response format
- ✅ All existing functionality preserved

## 🧪 Testing

### Test Without API Key
```bash
python test_gemini.py
```
Expected output: Falls back to mock embedding service

### Test With API Key
```bash
export GEMINI_API_KEY="your-key"
python test_gemini.py
```
Expected output: Creates real embeddings and responses

## 🔄 Migration Benefits

### Cost Efficiency
- **Gemini**: More cost-effective for most use cases
- **Rate Limits**: Generally more generous

### Performance
- **Gemini 1.5 Flash**: Optimized for speed and efficiency
- **Embedding Model**: Efficient semantic search

### Features
- **Context Window**: Large context support
- **Multimodal**: Ready for future image/document processing

## 🚨 Important Notes

1. **Vector Database**: Existing embeddings from OpenAI are incompatible with Gemini embeddings (different dimensions). You may need to regenerate your knowledge base.

2. **API Limits**: Gemini has different rate limits than OpenAI. Monitor usage accordingly.

3. **Model Differences**: Response style and quality may vary between GPT and Gemini models.

## 🔧 Troubleshooting

### "Import google.generativeai could not be resolved"
```bash
pip install google-generativeai==0.8.3
```

### "GEMINI_API_KEY environment variable is required"
```bash
export GEMINI_API_KEY="your-api-key"
```

### "Error creating Gemini embedding"
- Check your API key is valid
- Ensure you have credits/quota available
- Check network connectivity

### Embedding dimension mismatch
- Delete existing vector database: `rm src/database/vectors.pkl`
- Restart application to regenerate embeddings

## 📞 Support

For issues with:
- **Gemini API**: Check [Google AI Studio documentation](https://ai.google.dev/)
- **CodeWhisperer**: Review application logs for detailed error messages

## 🎯 Next Steps

1. **Regenerate Knowledge Base**: Run `python src/demo_data.py` to populate with Gemini embeddings
2. **Monitor Usage**: Track API usage in Google AI Studio
3. **Optimize**: Fine-tune parameters based on your use case

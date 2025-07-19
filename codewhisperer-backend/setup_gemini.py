#!/usr/bin/env python3
"""
Setup script for Gemini API integration
"""
import os

def setup_gemini_api():
    """Help users set up Gemini API key"""
    
    print("🚀 CodeWhisperer - Gemini API Setup")
    print("=" * 50)
    
    print("\n📋 Step 1: Get your Gemini API key")
    print("   1. Go to: https://makersuite.google.com/app/apikey")
    print("   2. Sign in with your Google account")
    print("   3. Click 'Create API Key'")
    print("   4. Copy the generated API key")
    
    print("\n🔧 Step 2: Set environment variable")
    
    current_key = os.getenv('GEMINI_API_KEY')
    if current_key:
        print(f"   ✅ GEMINI_API_KEY is already set: {current_key[:10]}...")
        use_existing = input("   Use existing key? (y/n): ").lower().strip()
        if use_existing == 'y':
            print("   ✅ Using existing API key")
            return True
    
    api_key = input("\n   Enter your Gemini API key: ").strip()
    
    if not api_key:
        print("   ❌ No API key provided")
        return False
    
    print("\n📝 Setting environment variable...")
    print("   Add this to your shell profile (~/.bashrc, ~/.zshrc, etc.):")
    print(f"   export GEMINI_API_KEY='{api_key}'")
    
    print("\n   Or run this command in your current session:")
    print(f"   export GEMINI_API_KEY='{api_key}'")
    
    # Set for current session
    os.environ['GEMINI_API_KEY'] = api_key
    
    print("\n✅ API key set for current session!")
    
    print("\n🧪 Testing the integration...")
    try:
        from src.services.gemini_embedding_service import GeminiEmbeddingService
        
        embedding_service = GeminiEmbeddingService()
        test_embedding = embedding_service.create_embedding("Test text")
        
        print("   ✅ Gemini API connection successful!")
        print(f"   ✅ Embedding created (dimension: {len(test_embedding)})")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error testing API: {str(e)}")
        print("   Please check your API key and try again")
        return False

if __name__ == "__main__":
    success = setup_gemini_api()
    
    if success:
        print("\n🎉 Setup complete! You can now run the CodeWhisperer backend:")
        print("   python src/main.py")
    else:
        print("\n⚠️  Setup incomplete. Please fix the issues above and try again.")

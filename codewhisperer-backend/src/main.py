import os
import sys
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from src.models.user import db
from src.models.document import Document, DocumentChunk, UserQuery
from src.routes.user import user_bp
from src.routes.chat import chat_bp
from src.routes.data import data_bp

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# ----------------------------
# Logging Configuration
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(module)s | %(message)s',
    handlers=[logging.StreamHandler()]
)

# ----------------------------
# Flask App Initialization
# ----------------------------
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'codewhisperer-secret-key-2024')

# Enable CORS (adjust origin later if needed)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ----------------------------
# Register Blueprints
# ----------------------------
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(data_bp, url_prefix='/api/data')

# ----------------------------
# Database Configuration
# ----------------------------
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# ----------------------------
# Ensure Database Tables Exist
# ----------------------------
with app.app_context():
    db.create_all()
    logging.info("✅ Database initialized and tables created")

# ----------------------------
# Health Check Endpoint
# ----------------------------
@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "CodeWhisperer API is running",
        "version": "1.0.0"
    })

# ----------------------------
# Root Endpoint
# ----------------------------
@app.route('/')
def root():
    return jsonify({
        "message": "CodeWhisperer API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "chat": "/api/chat",
            "data": "/api/data",
            "user": "/api/user"
        }
    })

# ----------------------------
# Run the Application
# ----------------------------
if __name__ == '__main__':
    try:
        logging.info("🚀 Starting Flask server on http://0.0.0.0:5002")
        app.run(host='0.0.0.0', port=5002, debug=True)
    except Exception as e:
        logging.exception("❌ Server failed to start")

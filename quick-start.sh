#!/bin/bash

echo "🚀 CodeWhisperer Quick Start Script"
echo "=================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ Prerequisites check passed!"

# Start backend
echo "🔧 Starting Backend..."
cd codewhisperer-backend

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install flask flask-cors Flask-SQLAlchemy requests numpy scikit-learn scipy joblib tqdm pydantic google-generativeai==0.1.0rc1

# Start backend in background
echo "🚀 Starting backend server..."
python -m src.main &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5002/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:5002"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting Frontend..."
cd ../codewhisperer-frontend

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
pnpm install

# Start frontend in background
echo "🚀 Starting frontend server..."
pnpm dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

# Check if frontend is running
if curl -s http://localhost:5176/ > /dev/null; then
    echo "✅ Frontend is running on http://localhost:5176"
else
    echo "❌ Frontend failed to start"
    exit 1
fi

echo ""
echo "🎉 CodeWhisperer is now running!"
echo "=================================="
echo "Frontend: http://localhost:5176"
echo "Backend API: http://localhost:5002"
echo "Health Check: http://localhost:5002/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait 
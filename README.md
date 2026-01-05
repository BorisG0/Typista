# Typista

Minimal single-player typing practice built with React, TypeScript, Vite, and Tailwind CSS.

## Requirements

- Node.js 18+
- Python 3.10+ (for AI freestyle feature)
- Gemini API key from [Google AI Studio](https://ai.google.dev/)

## Quick Start

```bash
# Frontend
cd frontend
npm install

# Backend (one-time setup)
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your GEMINI_API_KEY
```

## Running

Start both servers in separate terminals:

```bash
./start-backend.sh   # Runs on port 8000
./start-frontend.sh  # Runs on port 5173
```

Or manually:

```bash
# Terminal 1
cd backend && source .venv/bin/activate && fastapi dev main.py

# Terminal 2
cd frontend && npm run dev
```

## Build

```bash
cd frontend && npm run build
```

Produces a static bundle in `frontend/dist/`.

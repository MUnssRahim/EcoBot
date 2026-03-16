# RAG Sustainability Application

An intelligent RAG (Retrieval-Augmented Generation) system for analyzing sustainability and ESG metrics from documents.

## Features
- 📄 PDF upload and processing
- 🤖 AI-powered question answering
- 🔍 Semantic search and retrieval
- 💚 Sustainability and ESG analysis
- ⚡ Fast inference with Groq LLM
- 🧠 Cohere embeddings

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11
- **Vector DB**: Pinecone
- **LLM**: Groq Mistral
- **Embeddings**: Cohere
- **Deployment**: Vercel + Docker/Railway

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- API Keys:
  - Groq API Key (https://console.groq.com)
  - Pinecone API Key (https://www.pinecone.io)
  - Cohere API Key (https://cohere.com)

### Setup

1. **Clone repository**
```bash
git clone <repo-url>
cd ragsustainability_codes_deployed
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Setup Backend**
```bash
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000
```

4. **Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

5. **Open application**
Navigate to http://localhost:3000

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

## API Methods

### Upload PDF
```bash
POST /api/upload-pdf
Content-Type: multipart/form-data

file: <binary pdf>
```

### Ask Question (about PDF)
```bash
POST /api/ask-question
Content-Type: application/x-www-form-urlencoded

question=What are the ESG metrics?
```

### Ask Simple Question (general)
```bash
POST /api/ask-simple
Content-Type: application/x-www-form-urlencoded

question=What is sustainability?
```

## Project Structure

```
├── frontend/              # Next.js frontend application
├── main.py               # RAG logic and LLM integration
├── app.py                # FastAPI server
├── requirements.txt      # Python dependencies
├── Dockerfile            # Docker configuration
├── vercel.json          # Vercel deployment config
├── .env.example         # Environment variables template
└── DEPLOYMENT.md        # Deployment guide
```

## Environment Variables

```env
# API Keys
GROQ_API_KEY=your_key
PINECONE_API_KEY=your_key
COHERE_API_KEY=your_key

# Frontend
NEXT_PUBLIC_API_URL=/api  # For Vercel deployment
```

## Development

### Frontend Development
```bash
cd frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm run lint       # Run linter
```

### Backend Development
```bash
python -m uvicorn app:app --reload  # Start with auto-reload
```

## Notes
- PDFs are cached in memory for 10 minutes
- Use strong API keys and rotate regularly
- Always deploy with proper security headers
- Monitor API usage to avoid quota limits

## License
[Your License Here]

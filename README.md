# EcoBot – Sustainability RAG Assistant

EcoBot is an intelligent **Retrieval-Augmented Generation (RAG)** system that analyzes business documents and answers questions related to **sustainability and ESG practices**.

It allows users to upload **business PDFs (like sustainability or ESG reports)** and ask questions about them. The system retrieves relevant document sections and generates accurate answers using modern LLMs.

EcoBot can also answer **general sustainability questions**, even without a document.

---

# Features

- 📄 Upload and analyze business PDF reports  
- 🤖 AI-powered question answering  
- 🔍 Semantic search across documents  
- 🌱 Sustainability and ESG insights  
- ⚡ Fast responses using Groq LLM  
- 🧠 Cohere embeddings for semantic understanding  
- 📊 Vector search with Pinecone  

---

# Tech Stack

## Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

## Backend
- FastAPI
- Python 3.11

## AI Stack
- Groq (Mistral LLM)
- Cohere Embeddings
- Pinecone Vector Database

---

# Project Structure

```
EcoBot
│
├── frontend/        # Next.js frontend
├── main.py          # RAG pipeline and AI logic
├── app.py           # FastAPI backend
├── requirements.txt # Python dependencies
├── Dockerfile       # Container setup
├── vercel.json      # Vercel deployment config
└── .env.example     # Environment variable template
```

---

# Setup Instructions

## 1 Clone the Repository

```bash
git clone https://github.com/<your-username>/EcoBot.git
cd EcoBot
```

---

# 2 Configure Environment Variables

Create a `.env` file in the root directory.

```
GROQ_API_KEY=your_key
PINECONE_API_KEY=your_key
COHERE_API_KEY=your_key

NEXT_PUBLIC_API_URL=/api
```

---

# 3 Run Backend

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Run FastAPI server:

```bash
python -m uvicorn app:app --reload --port 8000
```

---

# 4 Run Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 5 Open the Application

```
http://localhost:3000
```

---

# API Endpoints

## Upload PDF

```
POST /api/upload-pdf
```

Form Data:

```
file: <pdf document>
```

---

## Ask Question About Uploaded PDF

```
POST /api/ask-question
```

Body:

```
question=What sustainability practices does the company follow?
```

---

## Ask General Sustainability Question

```
POST /api/ask-simple
```

Body:

```
question=What is ESG?
```

---

# Development

## Start Backend

```bash
python -m uvicorn app:app --reload
```

## Start Frontend

```bash
cd frontend
npm run dev
```

---

# Notes

- Uploaded PDFs are temporarily cached for processing
- Designed for **business sustainability analysis**
- Supports **document-based and general AI queries**
# EcoBot

EcoBot is a sustainability-focused AI assistant that helps users understand ESG and environmental performance by analyzing uploaded PDFs and answering sustainability-related questions using a retrieval-augmented generation (RAG) workflow.

Live demo: https://victorious-stone-0e5e7de00.1.azurestaticapps.net/

## Why EcoBot?

Businesses often have valuable sustainability knowledge locked inside ESG reports, annual filings, and policy documents. EcoBot brings that information into a conversational interface so users can quickly ask:

- What are the company’s environmental priorities?
- Which ESG themes are covered in the report?
- What sustainability actions are described in the document?
- How do the findings relate to broader sustainability practices?

## Key Features

- PDF upload and document-based analysis
- AI-powered question answering with contextual retrieval
- Sustainability and ESG-focused responses
- General sustainability Q&A without a document
- Fast frontend experience built with Next.js
- Backend API built with FastAPI
- Semantic retrieval using Pinecone + embeddings
- LLM integration with Groq

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Python
- FastAPI
- Uvicorn

### AI and Retrieval
- Groq LLM
- Cohere embeddings
- Pinecone vector database
- PDF processing with pdfplumber

## Project Structure

```text
EcoBot/
├── .github/
│   └── workflows/
│       └── main_ecobotsustainability.yml
├── api/
│   ├── __pycache__/
│   ├── index.py
│   └── main.py
├── frontend/
│   ├── app/
│   ├── public/
│   ├── .eslintrc.*
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   └── Dockerfile.dev
├── .env.example
├── .gitignore
├── README.md
├── requirements.txt
├── vercel.json
└── .vscode/
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/MUnssRahim/EcoBot.git
cd EcoBot
```

### 2. Configure environment variables

Copy the example file and add your real keys:

```bash
cp .env.example .env
```

Then update the values in `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
COHERE_API_KEY=your_cohere_api_key_here
NEXT_PUBLIC_API_URL=https://your-api-url-here
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the backend

```bash
python -m uvicorn api.index:app --reload --port 8000
```

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the app in your browser:

```text
http://localhost:3000
```

## API Overview

### Upload PDF

```http
POST /upload-pdf
```

Form field:

```text
file: <pdf-document>
```

### Ask a question about the uploaded PDF

```http
POST /ask-question
```

### Ask a general sustainability question

```http
POST /ask-simple
```

## Deployment

This project is configured for deployment on Azure and is also prepared for frontend hosting with Vercel-compatible patterns. The live application can be accessed here:

https://victorious-stone-0e5e7de00.1.azurestaticapps.net/

## Development Notes

- Uploaded PDFs are processed and temporarily retained for contextual use.
- The system supports both document-grounded and general sustainability interaction.
- The project is designed for business sustainability analysis, ESG review, and document-based insights.

## Contributing

Contributions are welcome. Please keep the project structure clean, follow existing patterns, and add meaningful documentation for new features.

## License

This project is intended for internal or learning use unless explicitly stated otherwise by the repository owner.

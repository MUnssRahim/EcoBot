
import os
import re
import math
import pdfplumber
import json
import requests
from langchain_pinecone import Pinecone as LangPinecone
from pinecone import Pinecone
import cohere
import logging
from datetime import datetime
import time
from dotenv import load_dotenv

load_dotenv()






GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

# Validate API keys are loaded
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables. Please set it in .env file.")
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY not found in environment variables. Please set it in .env file.")
if not COHERE_API_KEY:
    raise ValueError("COHERE_API_KEY not found in environment variables. Please set it in .env file.")

logging.info("✓ All API keys loaded successfully")

co_client = cohere.ClientV2(api_key=COHERE_API_KEY)


class CohereEmbeddings:
    def __init__(self, client):
        self.client = client

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        try:
            response = self.client.embed(
                texts=texts,
                model="embed-english-light-v3.0",
                input_type="search_document",
                embedding_types=["float"]
            )

            embeddings = response.embeddings
            if hasattr(embeddings, "float"):
                return embeddings.float
            if isinstance(embeddings, dict):
                return embeddings["float"]
            return embeddings

        except Exception as e:
            logging.exception("Cohere embed_documents API error")
            raise RuntimeError("Document embedding failed") from e

    def embed_query(self, text: str) -> list[float]:
        """Embed a single query for retrieval"""
        try:
            response = self.client.embed(
                texts=[text],
                model="embed-english-light-v3.0",
                input_type="search_query",
                embedding_types=["float"]
            )
            emb = response.embeddings[0]
            return emb.embedding if hasattr(emb, "embedding") else emb
        except Exception as e:
            logging.exception("Cohere embed_query API error")
            raise RuntimeError("Query embedding failed") from e



class GroqMistralLLM:
    def __init__(self, api_key):
        self.api_key = api_key
        self.url = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def invoke(self, prompt, options=None):
        if options is None:
            options = {}
        payload = {
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": options.get("temperature", 0.7),
            "top_p": options.get("top_p", 0.9),
            "max_tokens": options.get("max_tokens", 2000)
        }
        response = requests.post(self.url, headers=self.headers, json=payload)
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        else:
            raise Exception(f"Groq API Error: {response.status_code} - {response.text}")


index_name = "ragsustainability"
pc = Pinecone(api_key=PINECONE_API_KEY)
llm = GroqMistralLLM(api_key=GROQ_API_KEY)
embedding_model = CohereEmbeddings(co_client)
retriever = LangPinecone.from_existing_index(index_name=index_name, embedding=embedding_model)

business_text = "" #global 


def clean_text(text):
    text = re.sub(r"\[.*?\]", "", text)
    text = re.sub(r"[^a-zA-Z0-9.,:;’‘“”'\"()\n\- ]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def load_business_pdf(file_path):
    pages = []
    with pdfplumber.open(file_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text:
                pages.append(f"Page {page_number}\n{text}")
    return clean_text("\n".join(pages))


def build_document_chunks(file_path, chunk_size=1200, overlap=200):
    """Extract page-aware overlapping chunks for document-scoped retrieval."""
    chunks = []
    with pdfplumber.open(file_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if not text:
                continue
            normalized = clean_text(text)
            start = 0
            while start < len(normalized):
                end = min(start + chunk_size, len(normalized))
                if end < len(normalized):
                    boundary = normalized.rfind(" ", start + chunk_size // 2, end)
                    if boundary > start:
                        end = boundary
                chunk = normalized[start:end].strip()
                if chunk:
                    chunks.append({"page": page_number, "text": chunk})
                if end >= len(normalized):
                    break
                start = max(end - overlap, start + 1)
    embeddings = embedding_model.embed_documents([chunk["text"] for chunk in chunks])
    for chunk, embedding in zip(chunks, embeddings):
        chunk["embedding"] = embedding
    return chunks


def _cosine_similarity(left, right):
    numerator = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if not left_norm or not right_norm:
        return 0.0
    return numerator / (left_norm * right_norm)


def retrieve_document_chunks(question, chunks, limit=5):
    query_embedding = embedding_model.embed_query(question)
    ranked = sorted(
        chunks,
        key=lambda chunk: _cosine_similarity(query_embedding, chunk["embedding"]),
        reverse=True,
    )
    return ranked[:limit]


def store_business_text_from_pdf(file_path):
    global business_text
    business_text = load_business_pdf(file_path)
    return "✅ Business PDF processed."



# --- Setup Logging ---
logging.basicConfig(
    filename="esg_sdg_analysis.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
def ask_business_question(business_text, question, document_chunks=None, debug=False):
    log_prefix = f"[QUESTION] {question[:50]}..."

    try:
        if debug:
            print("\n🔍 Retrieving context from Pinecone...")
        if document_chunks:
            selected_chunks = retrieve_document_chunks(question, document_chunks)
            context = "\n\n".join(
                f"[Page {chunk['page']}] {chunk['text']}" for chunk in selected_chunks
            )
            docs = []
        else:
            docs = retriever.similarity_search(question, k=8)
            context = "\n\n".join(
                clean_text(getattr(doc, "page_content", "")[:3000]) for doc in docs
            )
        log_docs = []
    except Exception as e:
        print("❌ Pinecone retrieval failed:", str(e))
        docs = []
        log_docs = []

    for i, doc in enumerate(docs):
        cleaned_doc = clean_text(getattr(doc, "page_content", "")[:10000])
        log_docs.append(f"Document {i+1}: {cleaned_doc}")

    if not document_chunks:
        context = "\n\n".join([clean_text(getattr(doc, "page_content", "")[:3000]) for doc in docs])

    # --- STRICT ANTI-HALLUCINATION RULE ---
    anti_hallucination_rule = """
    CRITICAL INSTRUCTION: You must base your answer STRICTLY on the provided 'Business Profile' and 'Relevant Context'. 
    Do NOT hallucinate, guess, or pull in external data about other random companies. 
    If the exact information is not present in the provided text to accurately answer the question, you MUST reply with exactly: 
    "There is not enough information present in the uploaded PDF to answer this."
    """

    question_lower = question.lower()

    # --- Prompt selection ---
    if "esg" in question_lower:
        prompt = f"""
You are an ESG analyst. {anti_hallucination_rule}

Task:
Assign a score (out of 100) for each ESG pillar using the provided text.
- Environment: emissions, energy, waste.
- Social: labor rights, diversity, safety.
- Governance: ethics, board, transparency.

Format:
ESG Scores:
- Environment: XX / 100
- Social: XX / 100
- Governance: XX / 100

Briefly justify each score based ONLY on the text.

Business Profile:
{business_text[:8000]}

Relevant Context:
{context}

Question: {question}
Answer:
"""
    elif "carbon" in question_lower or "footprint" in question_lower or "scope " in question_lower:
        prompt = f"""
You are a Carbon Footprint Analyst. {anti_hallucination_rule}

Task:
1. Evaluate Scope 1, 2, and 3 emissions based ONLY on the text.
2. Give a carbon footprint score (0–100).
3. Justify the score.

Business Profile:
{business_text[:8000]}

Relevant Context:
{context}

Question: {question}
Answer:
"""
    elif "sdg" in question_lower or "sustainable development" in question_lower:
        prompt = f"""
You are a sustainability consultant. {anti_hallucination_rule}

Task:
- Identify supported UN SDG goals mentioned or clearly implied in the text.
- Highlight gaps and suggest 2 improvements.

Business Profile:
{business_text[:8000]}

Relevant Context:
{context}

Question: {question}
Answer:
"""
    else:
        # General Document Q&A Fallback (No forced SDG analysis!)
        prompt = f"""
You are a professional corporate document analyst. {anti_hallucination_rule}

Task:
Answer the user's question clearly and concisely, relying exclusively on the provided text. 
Do not analyze SDGs or ESG scores unless the user specifically asks for them.

Business Profile:
{business_text[:8000]}

Relevant Context:
{context}

Question: {question}
Answer:
"""

    if debug:
        print("\n💬 Generating Model Answer...\n")

    try:
        answer = llm.invoke(prompt, options={"temperature": 0.2, "top_p": 0.9}) # Lowered temp for less hallucination
        logging.info(f"{log_prefix}\nAnswer:\n{answer}")
        return answer
    except Exception as e:
        logging.error(f"{log_prefix} Failed with error: {e}")
        return "❌ An error occurred while generating the answer."
# Add this dictionary near the top of main.py, outside any functions if it isn't already
api_conversation_histories = {}

def ask_simple_question(question: str, session_id: str, debug=False):
    """API-friendly version of the simple question chat."""
    global api_conversation_histories

    if session_id not in api_conversation_histories:
        api_conversation_histories[session_id] = []
        
    history = api_conversation_histories[session_id]
    log_prefix = f"[{session_id}] [SIMPLE_QUESTION] {question[:50]}..."
    history.append(f"User: {question}")

    try:
        try:
            docs = retriever.similarity_search(question, k=4)
            contexts = [re.sub(r"\s+", " ", str(getattr(doc, "page_content", ""))[:1000]) for doc in docs]
            context = "\n\n".join(contexts)
        except Exception as pine_err:
            if debug:
                print("❌ Pinecone retrieval failed:", str(pine_err))
            context = ""

        recent_conversation = "\n".join(history[-6:])

        prompt = f"""
You are a knowledgeable sustainability expert having a friendly, clear conversation.
Answer the following general question about Environment and Sustainability.

Session ID: {session_id}

Previous conversation context:
{recent_conversation}

Relevant Sustainability Context:
{context}

Instructions:
- Provide a clear, complete answer (avoid abrupt endings).
- Minimum 70 words, maximum 200 words.
- Use examples from different real-world sustainability initiatives if applicable.
- CRITICAL: Do NOT mention UN SDG goals unless the user explicitly asks about them, or if they are directly relevant to the specific topic.
- Keep your tone environmental, eco-friendly, and educational.

Question: {question}
Answer:
"""

        answer = llm.invoke(prompt, options={"temperature": 0.5, "top_p": 0.9, "max_tokens": 400})

        if len(answer.split()) < 40 or not answer.strip().endswith(('.', '!', '?')):
            continuation_prompt = f"Continue from where you stopped:\n\n{answer}"
            cont = llm.invoke(continuation_prompt, options={"temperature": 0.5, "max_tokens": 200})
            answer = answer.strip() + " " + cont.strip()

        history.append(f"Assistant: {answer[:200]}...")
        api_conversation_histories[session_id] = history
        
        logging.info(f"{log_prefix}\nAnswer: {answer}")
        return answer

    except Exception as e:
        logging.exception(f"{log_prefix} Failed with error: {e}")
        raise e

def upload_business_pdf(file_path):
    """Upload and process a business PDF"""
    global business_text
    if not os.path.exists(file_path):
        return "❌ PDF file not found."
    
    business_text = load_business_pdf(file_path)
    conversation_history.append(f"System: Uploaded business PDF: {os.path.basename(file_path)}")
    return f"✅ Business PDF '{os.path.basename(file_path)}' processed and ready for analysis."

def clear_conversation():
    """Clear conversation history"""
    global conversation_history
    conversation_history = []
    return "✅ Conversation history cleared."

if __name__ == "__main__":
    print("🌍 ESG / SDG Sustainability Chat")
    print("──────────────────────────────────")
    print("💬 You can now ask general sustainability or SDG-related questions.")
    print("Type 'exit' to quit.\n")

    try:
        ask_simple_question(debug=True)
    except KeyboardInterrupt:
        print("\n👋 Exiting chat. Goodbye!\n")
    except Exception as e:
        print(f"❌ Error running chat: {e}")

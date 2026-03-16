from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import io
import uuid
import asyncio
import logging

# Make sure these imports match your actual file names!
from .main import load_business_pdf, ask_business_question
from .main import ask_simple_question

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pdf_text_store = {}
last_file_id = None
last_session_id = None

async def schedule_cleanup(file_id: str, delay_seconds: int = 600):
    await asyncio.sleep(delay_seconds)
    if file_id in pdf_text_store:
        del pdf_text_store[file_id]
        logging.info(f"[CLEANUP] Removed file_id: {file_id}")
        global last_file_id
        if last_file_id == file_id:
            last_file_id = None

@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    global last_file_id
    try:
        file_id = str(uuid.uuid4())
        file_contents = await file.read()
        pdf_text = load_business_pdf(io.BytesIO(file_contents))
        pdf_text_store[file_id] = pdf_text
        last_file_id = file_id
        
        logging.info(f"[UPLOAD] PDF stored for file_id: {file_id}")
        asyncio.create_task(schedule_cleanup(file_id))

        return {"status": "success", "file_id": file_id}

    except Exception as e:
        logging.error(f"[UPLOAD ERROR] {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/ask-question/")
async def ask_question_api(question: str = Form(...)):
    global last_file_id

    if not last_file_id or last_file_id not in pdf_text_store:
        return JSONResponse(
            status_code=400, 
            content={"error": "No PDF uploaded yet or file expired."}
        )

    try:
        # Get the text from the uploaded PDF
        business_text = pdf_text_store[last_file_id]
        
        # Pass the text AND the question to your function
        answer = ask_business_question(business_text, question)
        
        logging.info(f"[QUESTION] Answered business question for file_id: {last_file_id}")
        return {"question": question, "answer": answer}
    except Exception as e:
        logging.error(f"[QUESTION ERROR] {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/ask-simple/")
async def ask_simple_api(question: str = Form(...)):
    global last_session_id
    
    # Generate a session ID if one doesn't exist yet
    if not last_session_id:
        last_session_id = str(uuid.uuid4())

    try:
        # Pass BOTH the question and session_id to your main.py function
        answer = ask_simple_question(question, session_id=last_session_id)
        
        logging.info(f"[SIMPLE QUESTION] Answered general question for session: {last_session_id}")
        return {"question": question, "answer": answer}
        
    except Exception as e:
        logging.error(f"[SIMPLE QUESTION ERROR] {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
from dotenv import load_dotenv
import os

# Load environment variables first
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import text_processing, chat, management

app = FastAPI(title="Prime Chatbot AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(text_processing.router, prefix="/process", tags=["Processing"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(management.router, prefix="/manage", tags=["Management"])

@app.get("/")
def read_root():
    return {"status": "ok", "service": "backend-ai"}

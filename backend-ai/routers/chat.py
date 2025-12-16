from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from openai import OpenAI
from services.vector_db import search_vectors
from services.embedding import get_embedding, get_chat_completion
from services.audio import transcribe_audio, generate_speech

router = APIRouter()

class ChatRequest(BaseModel):
    companyId: str
    query: str = "" # Optional if inputAudio is provided
    history: list = [] # Optional history
    inputType: str = "text" # "text" or "voice"
    inputAudio: Optional[str] = None # Base64 encoded audio if inputType is "voice"
    systemPrompt: Optional[str] = None # Custom system prompt

@router.post("/generate")
async def generate_response(req: ChatRequest):
    try:
        # 1. Handle Voice Input
        current_query = req.query
        if req.inputType == "voice" and req.inputAudio:
            print("Transcribing audio...")
            transcribed_text = transcribe_audio(req.inputAudio)
            if transcribed_text:
                current_query = transcribed_text
                print(f"Transcribed: {current_query}")
            else:
                answer = "Sorry, I could not understand the audio."
                audio = generate_speech(answer)
                return {"answer": answer, "context": "", "inputType": "voice", "audio": audio}

        if not current_query:
             raise HTTPException(status_code=400, detail="Query is empty")

        # 2. Embed query
        query_vector = get_embedding(current_query)
        
        # 2. Search Context
        # Using companyId as collection name
        results = search_vectors(req.companyId, query_vector, limit=3)
        context_text = "\n\n".join([r.payload['text'] for r in results])
        
        # 3. Construct Prompt
        base_prompt = req.systemPrompt if req.systemPrompt else "You are a helpful AI assistant for the company. Use the following context to answer the user's question. If the answer is not in the context, say you don't know, but try to be helpful."
        
        system_prompt = f"""{base_prompt}

Context:
{context_text}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            *req.history,
            {"role": "user", "content": current_query}
        ]
        
        # 4. Generate Answer
        answer = get_chat_completion(messages)
        
        # 5. Handle Voice Output
        response_audio = None
        if req.inputType == "voice":
            print("Generating speech...")
            response_audio = generate_speech(answer)

        return {
            "answer": answer, 
            "context": context_text, 
            "inputType": req.inputType,
            "audio": response_audio
        }
    except Exception as e:
        print(f"Error generating chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class SummarizeRequest(BaseModel):
    history: List[dict]

@router.post("/summarize")
async def summarize_conversation(request: SummarizeRequest):
    try:
        if not request.history:
            return {"summary": "No conversation history."}

        # Convert history format to string
        conversation_text = "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in request.history])
        
        prompt = f"""Analyze the following conversation.
1. Summarize it in 2-3 sentences.
2. Rate the lead quality as HOT (ready to buy/highly interested), WARM (interested but needs info), or COLD (not interested).

Conversation:
{conversation_text}

Provide response in JSON format: {{ "summary": "...", "score": "HOT" }}"""

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            response_format={ "type": "json_object" }
        )
        
        import json
        content = response.choices[0].message.content.strip()
        result = json.loads(content)
        
        return result

    except Exception as e:
        print(f"Summarization error: {e}")
        return {"summary": "Failed to summarize conversation."}

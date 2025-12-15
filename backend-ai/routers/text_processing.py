from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.vector_db import upsert_vectors
from services.embedding import get_embedding
from langchain.text_splitter import RecursiveCharacterTextSplitter
from qdrant_client.http import models
import uuid

router = APIRouter()

class IngestRequest(BaseModel):
    companyId: str
    text: str
    metadata: dict = {}

@router.post("/ingest")
async def ingest_text(req: IngestRequest):
    try:
        if not req.text:
            return {"status": "ignored", "reason": "empty text"}
            
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_text(req.text)
        
        points = []
        for chunk in chunks:
            vector = get_embedding(chunk)
            if not vector:
                continue
                
            points.append(models.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "text": chunk,
                    "companyId": req.companyId,
                    **req.metadata
                }
            ))

        if points:
            upsert_vectors(req.companyId, points) # Use companyId as collection name

        return {"status": "success", "chunks_processed": len(points)}
    except Exception as e:
        print(f"Error ingesting: {e}")
        raise HTTPException(status_code=500, detail=str(e))

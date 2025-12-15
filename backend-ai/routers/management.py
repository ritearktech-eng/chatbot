from fastapi import APIRouter
from pydantic import BaseModel
from services.vector_db import delete_collection

router = APIRouter()

class CompanyRequest(BaseModel):
    companyId: str

@router.post("/delete-document")
async def delete_document_vectors(req: CompanyRequest):
    # Depending on how flexible we want to be, we might need a more specific request model
    # containing docId. But for now, let's assume the caller passes docId in payload or we define a new model.
    pass

class DeleteDocRequest(BaseModel):
    companyId: str
    docId: str

@router.post("/delete-document-vectors")
async def delete_company_document_vectors(req: DeleteDocRequest):
    from services.vector_db import delete_vectors
    delete_vectors(req.companyId, "docId", req.docId)
    return {"status": "deleted", "docId": req.docId}

class UpdateStatusRequest(BaseModel):
    companyId: str
    docId: str
    isActive: bool

@router.post("/update-document-status")
async def update_company_document_status(req: UpdateStatusRequest):
    from services.vector_db import update_payload
    update_payload(req.companyId, "docId", req.docId, {"isActive": req.isActive})
    return {"status": "updated", "docId": req.docId, "isActive": req.isActive}

@router.post("/delete-collection")
async def delete_company_collection(req: CompanyRequest):
    delete_collection(req.companyId)
    return {"status": "deleted"}

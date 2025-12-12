from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from services.rag_service import rag_service

router = APIRouter(prefix="/api/rag", tags=["RAG - AI Chat"])

class QuestionRequest(BaseModel):
    question: str

class RelationshipRequest(BaseModel):
    person1: str
    person2: str

@router.post("/ask")
async def ask_question(request: QuestionRequest):
    """
    Ask a question about the family tree.
    
    Examples:
    - "Who are John's grandchildren?"
    - "How is Mary related to Tom?"
    - "List all the doctors in our family"
    - "Who got married in 1985?"
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    return await rag_service.answer_question_async(request.question)

@router.post("/ask/sync")
def ask_question_sync(request: QuestionRequest):
    """Synchronous version of ask question"""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    return rag_service.answer_question(request.question)

@router.post("/relationship")
async def explain_relationship(request: RelationshipRequest):
    """
    Explain the relationship between two family members.
    
    Example: person1="John Doe", person2="Jane Smith"
    """
    if not request.person1.strip() or not request.person2.strip():
        raise HTTPException(status_code=400, detail="Both person names are required")
    
    return rag_service.get_relationship_explanation(
        request.person1, 
        request.person2
    )

@router.get("/summary")
async def get_family_summary():
    """Get a summary of the entire family tree"""
    return rag_service.get_family_summary()

@router.get("/suggestions")
async def get_question_suggestions():
    """Get suggested questions to ask about the family"""
    return {"suggestions": rag_service.suggest_questions()}

@router.get("/models")
async def get_available_models():
    """Get list of available AI models"""
    from services.pollinations import PollinationsClient
    return {
        "available_models": list(PollinationsClient.MODELS.keys()),
        "current_model": rag_service.client.model,
        "note": "All models are FREE via Pollinations AI!"
    }
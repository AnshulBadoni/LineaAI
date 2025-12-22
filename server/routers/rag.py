# routes/rag_routes.py
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from services.rag_service import rag_service

router = APIRouter(prefix="/api/rag", tags=["RAG - AI Chat"])


class QuestionRequest(BaseModel):
    question: str
    session_id: Optional[str] = None  # Client can provide session_id


class RelationshipRequest(BaseModel):
    person1: str
    person2: str
    session_id: Optional[str] = None


class SessionResponse(BaseModel):
    session_id: str


@router.post("/session")
async def create_session() -> SessionResponse:
    """Create a new conversation session"""
    session_id = rag_service.memory.create_session()
    return SessionResponse(session_id=session_id)


@router.post("/ask")
async def ask_question(request: QuestionRequest):
    """
    Ask a question about the family tree.
    
    Include session_id to maintain conversation context.
    The response includes session_id - use it for follow-up questions.
    
    Examples:
    1. First question: "Tell me about John Doe"
    2. Follow-up: "What about his wife?" (with same session_id)
    3. Follow-up: "Do they have children?" (with same session_id)
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    return await rag_service.answer_question_async(
        request.question, 
        session_id=request.session_id
    )


@router.post("/ask/sync")
def ask_question_sync(request: QuestionRequest):
    """Synchronous version of ask question"""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    return rag_service.answer_question(
        request.question,
        session_id=request.session_id
    )


@router.post("/relationship")
async def explain_relationship(request: RelationshipRequest):
    """Explain the relationship between two family members."""
    if not request.person1.strip() or not request.person2.strip():
        raise HTTPException(status_code=400, detail="Both person names are required")

    return rag_service.get_relationship_explanation(
        request.person1, 
        request.person2,
        session_id=request.session_id
    )


@router.get("/history/{session_id}")
async def get_conversation_history(session_id: str):
    """Get the conversation history for a session"""
    history = rag_service.get_conversation_history(session_id)
    return {"session_id": session_id, "messages": history}


@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear conversation history and end session"""
    rag_service.clear_conversation(session_id)
    return {"message": "Session cleared", "session_id": session_id}


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
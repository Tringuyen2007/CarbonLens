from fastapi import APIRouter, HTTPException
from app.models.schemas import AskRequest, AskResponse

router = APIRouter()


@router.post("/ask", response_model=AskResponse)
async def ask_question(body: AskRequest):
    # RAG pipeline requires ChromaDB + Anthropic API key — deferred.
    # Return a clear 503 so the frontend error state is meaningful during dev.
    raise HTTPException(
        503,
        "AI Q&A not yet available — ChromaDB and ANTHROPIC_API_KEY required. "
        "Set VITE_USE_MOCK_DATA=true in the frontend .env to use mock responses.",
    )

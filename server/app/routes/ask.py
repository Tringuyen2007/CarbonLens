from fastapi import APIRouter, HTTPException
from app.models.schemas import AskRequest, AskResponse, AskSource
from app.services.rag import query_rag_openai
from app.services import mongo

router = APIRouter()


@router.post("/ask", response_model=AskResponse)
async def ask_question(body: AskRequest):
    # Fetch city + emissions docs if city_id provided (for grounded context)
    city_doc = None
    emissions_doc = None
    if body.city_id and mongo.is_connected():
        db = mongo.get_db()
        city_doc = await db.cities.find_one({"city_id": body.city_id}, {"_id": 0})
        emissions_doc = await db.emissions.find_one({"city_id": body.city_id}, {"_id": 0})

    # Convert history pydantic models to plain dicts for OpenAI
    history = (
        [{"role": m.role, "content": m.content} for m in body.history]
        if body.history else None
    )

    try:
        result = await query_rag_openai(
            query=body.query,
            city_id=body.city_id,
            history=history,
            city_doc=city_doc,
            emissions_doc=emissions_doc,
        )
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))
    except Exception as exc:
        raise HTTPException(500, f"Chat failed: {exc}")

    return AskResponse(
        answer=result["answer"],
        confidence=result["confidence"],
        sources=[AskSource(**s) for s in result["sources"]],
        time_ms=result["time_ms"],
    )

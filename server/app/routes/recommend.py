from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from app.models.schemas import RecommendationsResponse
from app.services import mongo
from app.services.rag import generate_recommendations

router = APIRouter()


@router.get("/recommendations/{city_id}", response_model=RecommendationsResponse)
async def get_recommendations(city_id: str):
    if not mongo.is_connected():
        raise HTTPException(503, "Database unavailable — run the seed script first")
    db = mongo.get_db()
    doc = await db.recommendations.find_one({"city_id": city_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, f"Recommendations not found: {city_id}")
    return doc


@router.post("/recommendations/{city_id}/generate", response_model=RecommendationsResponse)
async def generate_city_recommendations(city_id: str):
    if not mongo.is_connected():
        raise HTTPException(503, "Database unavailable")
    db = mongo.get_db()

    city_doc = await db.cities.find_one({"city_id": city_id}, {"_id": 0})
    if not city_doc:
        raise HTTPException(404, f"City not found: {city_id}")

    emissions_doc = await db.emissions.find_one({"city_id": city_id}, {"_id": 0})
    if not emissions_doc:
        raise HTTPException(404, f"Emissions data not found: {city_id}")

    try:
        recs = await generate_recommendations(city_doc, emissions_doc)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))
    except Exception as exc:
        raise HTTPException(500, f"Generation failed: {exc}")

    timestamp = datetime.now(timezone.utc).isoformat()
    doc = {
        "city_id": city_id,
        "recommendations": recs,
        "generated_at": timestamp,
    }

    await db.recommendations.update_one(
        {"city_id": city_id},
        {"$set": doc},
        upsert=True,
    )

    return doc

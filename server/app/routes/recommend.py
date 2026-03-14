from fastapi import APIRouter, HTTPException
from app.models.schemas import RecommendationsResponse
from app.services import mongo

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

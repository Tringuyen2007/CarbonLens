from fastapi import APIRouter, HTTPException
from app.models.schemas import EmissionsSummary
from app.services import mongo

router = APIRouter()


@router.get("/emissions/{city_id}/summary", response_model=EmissionsSummary)
async def get_emissions_summary(city_id: str):
    if not mongo.is_connected():
        raise HTTPException(503, "Database unavailable — run the seed script first")
    db = mongo.get_db()
    doc = await db.emissions.find_one({"city_id": city_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, f"Emissions data not found: {city_id}")
    return doc

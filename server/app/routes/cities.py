from fastapi import APIRouter, HTTPException
from app.models.schemas import CityListItem, CityDetail
from app.services import mongo

router = APIRouter()

_PROJECTION_LIST = {
    "_id": 0,
    "city_id": 1, "name": 1, "state": 1,
    "lat": 1, "lng": 1,
    "total_co2e_mt": 1, "co2e_per_capita": 1,
    "has_bps": 1, "trend_yoy": 1,
}


@router.get("/cities", response_model=list[CityListItem])
async def list_cities():
    if not mongo.is_connected():
        raise HTTPException(503, "Database unavailable — run the seed script first")
    db = mongo.get_db()
    docs = await db.cities.find({}, _PROJECTION_LIST).to_list(None)
    return docs


@router.get("/cities/{city_id}", response_model=CityDetail)
async def get_city(city_id: str):
    if not mongo.is_connected():
        raise HTTPException(503, "Database unavailable — run the seed script first")
    db = mongo.get_db()
    doc = await db.cities.find_one({"city_id": city_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, f"City not found: {city_id}")
    return doc

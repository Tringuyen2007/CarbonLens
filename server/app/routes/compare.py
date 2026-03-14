from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import CompareResponse, CompareCity
from app.services import mongo

router = APIRouter()


@router.get("/compare", response_model=CompareResponse)
async def compare_cities(cities: str = Query(..., description="Comma-separated city_ids")):
    if not mongo.is_connected():
        raise HTTPException(503, "Database unavailable — run the seed script first")

    city_ids = [c.strip() for c in cities.split(",") if c.strip()]
    if not city_ids:
        raise HTTPException(400, "Provide at least one city_id in ?cities=")
    if len(city_ids) > 5:
        raise HTTPException(400, "Compare supports at most 5 cities at a time")

    db = mongo.get_db()
    projection = {
        "_id": 0,
        "city_id": 1, "name": 1, "state": 1,
        "total_co2e_mt": 1, "co2e_per_capita": 1,
        "has_bps": 1, "trend_yoy": 1, "population": 1,
        "renewables.solar_ghi": 1,
        "grid.renewable_pct": 1,
        "bps.name": 1,
    }
    docs = await db.cities.find(
        {"city_id": {"$in": city_ids}}, projection
    ).to_list(None)

    result: list[CompareCity] = []
    for doc in docs:
        result.append(CompareCity(
            city_id=doc["city_id"],
            name=doc["name"],
            state=doc["state"],
            total_co2e_mt=doc["total_co2e_mt"],
            co2e_per_capita=doc["co2e_per_capita"],
            has_bps=doc["has_bps"],
            trend_yoy=doc.get("trend_yoy"),
            solar_ghi=doc.get("renewables", {}).get("solar_ghi"),
            grid_renewable_pct=doc.get("grid", {}).get("renewable_pct"),
            bps_name=doc.get("bps", {}).get("name") if doc.get("bps") else None,
            population=doc["population"],
        ))

    return CompareResponse(cities=result)

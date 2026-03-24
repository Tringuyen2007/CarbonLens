#!/usr/bin/env python3
"""
seed_database.py — Load cities_base.json into MongoDB.

Usage (from repo root):
    cd CarbonLens
    MONGODB_URI="mongodb+srv://..." python scripts/seed_database.py

Prerequisites:
    pip install motor python-dotenv
    # Set MONGODB_URI in server/.env or export it in your shell
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent.parent / "server" / ".env")

MONGODB_URI = os.getenv("MONGODB_URI")
DATA_DIR = Path(__file__).parent.parent / "data"


# Sector colors — must match SECTOR_COLORS in client/src/lib/colors.js exactly
SECTOR_COLORS = {
    "Buildings": "#FF6B6B",
    "Transport":  "#4ECDC4",
    "Industry":   "#45B7D1",
    "Waste":      "#96CEB4",
    "Other":      "#FFEAA7",
}


# Minimum ratio of (Climate TRACE metro total) / (curated city total) required to trust
# the API's sector percentages. Cities below this threshold have incomplete CT coverage
# and their sector splits would be misleading — fall back to calibrated synthetic instead.
COVERAGE_THRESHOLD = 0.03

# If any single sector exceeds this share of total emissions the CT sample is skewed
# (e.g. one large industrial point source dominates, masking transport/buildings reality).
# Affected examples: Miami Industry=65.7% (port fossil-fuel ops), San Diego Buildings=68.3%
# (military campus point sources only). Fall back to synthetic for these cities.
MAX_SINGLE_SECTOR_PCT = 65.0


def make_emissions_from_trace(city_id, curated_total, trace_data, base_2019):
    """Build emissions doc using real Climate TRACE sector percentages × curated city-proper total.
    Uses Option A: keeps trusted curated totals, replaces synthetic sector splits with real ones."""
    if not curated_total or curated_total <= 0:
        raise ValueError(f"make_emissions_from_trace: curated_total must be > 0 for {city_id}")
    sectors_out = []
    for s in trace_data["sectors_normalized"]:
        sector = s["sector"]
        co2e_mt = round(curated_total * s["pct"] / 100)
        sectors_out.append({
            "sector": sector,
            "co2e_mt": co2e_mt,
            "pct": s["pct"],
            "color": SECTOR_COLORS.get(sector, "#FFEAA7"),
        })
    return {
        "city_id": city_id,
        "data_quality": "real",   # internal provenance field — not exposed via API
        "sectors": [s for s in sectors_out if s["co2e_mt"] > 0],
        "trend_5yr": [
            {"year": 2019, "co2e_mt": round(base_2019)},
            {"year": 2020, "co2e_mt": round(base_2019 * 0.93)},
            {"year": 2021, "co2e_mt": round(base_2019 * 0.96)},
            {"year": 2022, "co2e_mt": round(base_2019 * 0.97)},
            {"year": 2023, "co2e_mt": curated_total},
        ],
    }


def make_emissions(city_id, total, building_pct, transport_pct, industry_pct, waste_pct, base_2019):
    buildings = round(total * building_pct)
    transport  = round(total * transport_pct)
    industry   = round(total * industry_pct)
    waste      = round(total * waste_pct)
    other      = total - buildings - transport - industry - waste
    sectors = [
        {"sector": "Buildings", "co2e_mt": buildings, "pct": round(building_pct * 1000) / 10, "color": "#FF6B6B"},
        {"sector": "Transport", "co2e_mt": transport,  "pct": round(transport_pct * 1000) / 10, "color": "#4ECDC4"},
        {"sector": "Industry",  "co2e_mt": industry,   "pct": round(industry_pct * 1000) / 10, "color": "#45B7D1"},
        {"sector": "Waste",     "co2e_mt": waste,      "pct": round(waste_pct * 1000) / 10, "color": "#96CEB4"},
        {"sector": "Other",     "co2e_mt": other,      "pct": round((other / total) * 1000) / 10, "color": "#FFEAA7"},
    ]
    return {
        "city_id": city_id,
        "data_quality": "synthetic",  # internal provenance field — not exposed via API
        "sectors": [s for s in sectors if s["co2e_mt"] > 0],
        "trend_5yr": [
            {"year": 2019, "co2e_mt": round(base_2019)},
            {"year": 2020, "co2e_mt": round(base_2019 * 0.93)},
            {"year": 2021, "co2e_mt": round(base_2019 * 0.96)},
            {"year": 2022, "co2e_mt": round(base_2019 * 0.97)},
            {"year": 2023, "co2e_mt": total},
        ],
    }


# Derived from mockData.js MOCK_EMISSIONS — matches frontend exactly
EMISSIONS_PARAMS = {
    "nyc":          (48200000, 0.459, 0.301, 0.12,  0.06,  52100000),
    "boston":       (6800000,  0.51,  0.28,  0.09,  0.06,  7600000),
    "dc":           (5200000,  0.48,  0.32,  0.08,  0.05,  5700000),
    "denver":       (8400000,  0.41,  0.35,  0.14,  0.05,  9200000),
    "seattle":      (7500000,  0.38,  0.44,  0.10,  0.04,  8100000),
    "stlouis":      (3600000,  0.36,  0.29,  0.25,  0.06,  3800000),
    "la":           (42000000, 0.35,  0.48,  0.09,  0.05,  45000000),
    "chicago":      (22500000, 0.43,  0.31,  0.17,  0.05,  24000000),
    "houston":      (86000000, 0.22,  0.28,  0.42,  0.04,  82000000),
    "phoenix":      (22500000, 0.36,  0.44,  0.12,  0.04,  20000000),
    "sf":           (4200000,  0.44,  0.38,  0.09,  0.05,  5000000),
    "austin":       (11800000, 0.31,  0.46,  0.14,  0.05,  10500000),
    "portland":     (5200000,  0.38,  0.42,  0.11,  0.05,  5800000),
    "miami":        (14500000, 0.42,  0.40,  0.10,  0.05,  14000000),
    "atlanta":      (16200000, 0.37,  0.44,  0.11,  0.05,  17000000),
    "minneapolis":  (4800000,  0.47,  0.29,  0.15,  0.06,  5300000),
    "sandiego":     (9800000,  0.37,  0.46,  0.09,  0.05,  11000000),
    "dallas":       (24800000, 0.30,  0.40,  0.22,  0.04,  22000000),
    "detroit":      (8400000,  0.38,  0.30,  0.24,  0.05,  8800000),
    "philadelphia": (15600000, 0.45,  0.32,  0.14,  0.06,  17000000),
}


async def main():
    if not MONGODB_URI:
        print("ERROR: MONGODB_URI not set. Copy server/.env.example to server/.env and fill in your cluster URI.")
        sys.exit(1)

    client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=10_000)
    db = client["carbonlens"]

    # ── Cities ────────────────────────────────────────────────────────────────
    cities = json.loads((DATA_DIR / "cities_base.json").read_text())

    # Merge real API data when available (generated by fetch_solar_data.py / fetch_grid_data.py)
    # Falls back to cities_base.json values if files are absent or city is missing.
    solar_path = DATA_DIR / "raw" / "solar_data.json"
    grid_path  = DATA_DIR / "raw" / "grid_data.json"
    solar_data = json.loads(solar_path.read_text()) if solar_path.exists() else {}
    grid_data  = json.loads(grid_path.read_text())  if grid_path.exists()  else {}
    if solar_data:
        print(f"  Merging NREL solar GHI for {len(solar_data)} cities")
    if grid_data:
        print(f"  Merging EIA grid data for {len(grid_data)} cities")
    for city in cities:
        cid = city["city_id"]
        if cid in solar_data and solar_data[cid].get("solar_ghi") is not None:
            city.setdefault("renewables", {})["solar_ghi"] = solar_data[cid]["solar_ghi"]
        if cid in grid_data:
            g = grid_data[cid]
            if g.get("carbon_intensity") is not None:
                city.setdefault("grid", {})["carbon_intensity"] = g["carbon_intensity"]
            if g.get("renewable_pct") is not None:
                city.setdefault("grid", {})["renewable_pct"] = g["renewable_pct"]

    await db.cities.drop()
    result = await db.cities.insert_many(cities)
    print(f"Inserted {len(result.inserted_ids)} cities")

    # Create geospatial index (2dsphere requires GeoJSON; this is a flat index for lat/lng)
    await db.cities.create_index([("city_id", 1)], unique=True)
    await db.cities.create_index([("total_co2e_mt", -1)])
    print("  indexes: city_id (unique), total_co2e_mt")

    # ── Emissions ─────────────────────────────────────────────────────────────
    # Load Climate TRACE summary if available (generated by fetch_climate_trace.py)
    trace_summary_path = DATA_DIR / "raw" / "climate_trace_summary.json"
    trace_summary = {}
    if trace_summary_path.exists():
        trace_summary = json.loads(trace_summary_path.read_text())
        print(f"  Using Climate TRACE data for {len(trace_summary)} cities")

    # Build a lookup of curated totals from cities_base.json
    curated_totals = {c["city_id"]: c["total_co2e_mt"] for c in cities}

    emissions_docs = []
    real_count = 0
    synthetic_count = 0
    for city_id, params in EMISSIONS_PARAMS.items():
        base_2019 = params[5]
        if city_id in trace_summary:
            curated_total = curated_totals.get(city_id, params[0])
            trace_total = trace_summary[city_id].get("total_co2e_mt", 0)
            coverage = trace_total / curated_total if curated_total else 0
            max_sector_pct = max(
                (s["pct"] for s in trace_summary[city_id].get("sectors_normalized", [])),
                default=0,
            )
            # For high-coverage cities (>=10%) trust the data regardless of sector distribution —
            # the sample is comprehensive. For borderline coverage (3–10%), also reject if a single
            # sector dominates implausibly (e.g. Miami Industry=65.7% from port fossil-fuel ops).
            sector_skewed = coverage < 0.10 and max_sector_pct > MAX_SINGLE_SECTOR_PCT
            if coverage >= COVERAGE_THRESHOLD and not sector_skewed:
                emissions_docs.append(
                    make_emissions_from_trace(city_id, curated_total, trace_summary[city_id], base_2019)
                )
                real_count += 1
            else:
                if coverage < COVERAGE_THRESHOLD:
                    reason = f"CT coverage {coverage:.2f} < {COVERAGE_THRESHOLD}"
                else:
                    reason = f"max sector {max_sector_pct:.1f}% > {MAX_SINGLE_SECTOR_PCT}% (skewed low-coverage sample)"
                print(f"  {city_id}: {reason} — synthetic fallback")
                emissions_docs.append(make_emissions(city_id, *params))
                synthetic_count += 1
        else:
            emissions_docs.append(make_emissions(city_id, *params))
            synthetic_count += 1

    # Safety check: ensure all docs built before dropping existing data
    expected = len(EMISSIONS_PARAMS)
    if len(emissions_docs) != expected:
        print(f"ERROR: Expected {expected} emissions docs, got {len(emissions_docs)}. Aborting.")
        sys.exit(1)

    await db.emissions.drop()
    result = await db.emissions.insert_many(emissions_docs)
    print(f"Inserted {len(result.inserted_ids)} emissions documents "
          f"({real_count} real Climate TRACE, {synthetic_count} synthetic fallback)")
    await db.emissions.create_index([("city_id", 1)], unique=True)

    # ── Recommendations ───────────────────────────────────────────────────────
    # Seed from data/recommendations.json if it exists (generated by generate_recommendations.py later)
    recs_path = DATA_DIR / "recommendations.json"
    if recs_path.exists():
        recs = json.loads(recs_path.read_text())
        await db.recommendations.drop()
        result = await db.recommendations.insert_many(recs)
        print(f"Inserted {len(result.inserted_ids)} recommendation documents")
        await db.recommendations.create_index([("city_id", 1)], unique=True)
    else:
        print("Skipped recommendations (data/recommendations.json not found)")

    client.close()
    print("\nDone. Run the server: cd server && uvicorn app.main:app --reload")


if __name__ == "__main__":
    asyncio.run(main())

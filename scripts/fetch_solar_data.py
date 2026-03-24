#!/usr/bin/env python3
"""
fetch_solar_data.py — Fetch annual solar irradiance (GHI) for each city from NREL PVWatts API.

Reads:  data/cities_base.json   (for lat/lng per city)
Writes: data/raw/solar_data.json (city_id → solar_ghi in kWh/m²/day)

Usage (from repo root):
    cd CarbonLens
    python scripts/fetch_solar_data.py

After running, re-seed the database:
    python scripts/seed_database.py
"""

import json
import os
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "server" / ".env")

NREL_API_KEY = os.getenv("NREL_API_KEY", "").strip()
NREL_URL = "https://developer.nrel.gov/api/pvwatts/v8.json"
DATA_DIR = Path(__file__).parent.parent / "data"
RAW_DIR = DATA_DIR / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)


def fetch_ghi(session: httpx.Client, city_id: str, lat: float, lng: float) -> float | None:
    """Returns solrad_annual (kWh/m²/day) for a location. Returns None on error."""
    try:
        r = session.get(
            NREL_URL,
            params={
                "api_key": NREL_API_KEY,
                "lat": lat,
                "lon": lng,
                "system_capacity": 1,
                "azimuth": 180,
                "tilt": 20,
                "array_type": 1,
                "module_type": 1,
                "losses": 14,
            },
            timeout=20,
        )
        r.raise_for_status()
        data = r.json()
        errors = data.get("errors", [])
        if errors:
            print(f"  ERROR {city_id}: {errors}")
            return None
        return round(data["outputs"]["solrad_annual"], 2)
    except Exception as exc:
        print(f"  ERROR {city_id}: {exc}")
        return None


def main():
    if not NREL_API_KEY:
        print("ERROR: NREL_API_KEY not set in server/.env")
        return

    cities = json.loads((DATA_DIR / "cities_base.json").read_text())
    results: dict[str, dict] = {}

    with httpx.Client() as session:
        for city in cities:
            city_id = city["city_id"]
            lat, lng = city["lat"], city["lng"]
            print(f"Fetching solar GHI: {city_id} ({lat}, {lng})…")
            ghi = fetch_ghi(session, city_id, lat, lng)
            if ghi is not None:
                results[city_id] = {"solar_ghi": ghi}
                print(f"  → {ghi} kWh/m²/day")
            time.sleep(0.2)  # be polite to the API

    out_path = RAW_DIR / "solar_data.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\nSaved {len(results)} cities to {out_path}")
    print("Next: python scripts/seed_database.py")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
fetch_climate_trace.py — Pull 2023 city-level emissions from Climate TRACE API v7.

No API key required. Saves raw JSON to data/raw/climate_trace_{city_id}.json.

Usage (from repo root):
    cd CarbonLens
    pip install httpx
    python scripts/fetch_climate_trace.py

Climate TRACE city IDs confirmed via manual API check (2024-03):
  nyc       → ghs-fua_7244   (NYC metro, ~178M tonnes)
  houston   → ghs-fua_5511
  la        → ghs-fua_1642
  chicago   → ghs-fua_6654
  boston    → ghs-fua_7234
  dc        → ghs-fua_7267
  denver    → ghs-fua_5389
  seattle   → ghs-fua_6989
  sf        → ghs-fua_6981
  austin    → ghs-fua_5101
  portland  → ghs-fua_6727
  miami     → ghs-fua_6197
  atlanta   → ghs-fua_5098
  stlouis   → ghs-fua_6859
  phoenix   → ghs-fua_6672
  minneapolis → ghs-fua_6268
  sandiego  → ghs-fua_6802
  dallas    → ghs-fua_5347
  detroit   → ghs-fua_5466
  philadelphia → ghs-fua_6620

NOTE: Climate TRACE returns METRO AREA data (functional urban areas), not city-proper.
      Values will be larger than the city-level mock data.
      The seed script uses the curated cities_base.json values until you decide
      how to normalize metro → city-proper.
"""

import json
import time
from pathlib import Path

import httpx

BASE_URL = "https://api.climatetrace.org/v7"
RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

CITY_IDS = {
    "nyc":          "ghs-fua_7244",
    "houston":      "ghs-fua_5511",
    "la":           "ghs-fua_1642",
    "chicago":      "ghs-fua_6654",
    "boston":       "ghs-fua_7234",
    "dc":           "ghs-fua_7267",
    "denver":       "ghs-fua_5389",
    "seattle":      "ghs-fua_6989",
    "sf":           "ghs-fua_6981",
    "austin":       "ghs-fua_5101",
    "portland":     "ghs-fua_6727",
    "miami":        "ghs-fua_6197",
    "atlanta":      "ghs-fua_5098",
    "stlouis":      "ghs-fua_6859",
    "phoenix":      "ghs-fua_6672",
    "minneapolis":  "ghs-fua_6268",
    "sandiego":     "ghs-fua_6802",
    "dallas":       "ghs-fua_5347",
    "detroit":      "ghs-fua_5466",
    "philadelphia": "ghs-fua_6620",
}

SECTOR_NORMALIZATION = {
    "buildings":              "Buildings",
    "agriculture":            "Other",
    "forestry-and-land-use":  "Other",
    "fossil-fuel-operations": "Industry",
    "manufacturing":          "Industry",
    "mineral-extraction":     "Industry",
    "power":                  "Industry",
    "transportation":         "Transport",
    "waste":                  "Waste",
    "other-energy-use":       "Other",
}


def fetch_city(session: httpx.Client, city_id: str, trace_id: str) -> dict | None:
    """Fetch 2023 emissions for one city. Returns None on error."""
    url = f"{BASE_URL}/city/emissions"
    params = {"city_id": trace_id, "since": "2023-01-01", "to": "2024-01-01"}
    try:
        r = session.get(url, params=params, timeout=20)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError as exc:
        print(f"  ERROR {city_id}: {exc}")
        return None


def normalize(raw: dict, city_id: str, trace_id: str) -> dict:
    """Convert raw API response to a normalized structure matching our schema."""
    sectors_raw = raw.get("emissions", {}).get("sectors", {})
    sector_totals: dict[str, float] = {}
    for trace_sector, value in sectors_raw.items():
        display = SECTOR_NORMALIZATION.get(trace_sector, "Other")
        sector_totals[display] = sector_totals.get(display, 0) + value

    total = sum(sector_totals.values())
    return {
        "city_id": city_id,
        "trace_id": trace_id,
        "year": 2023,
        "total_co2e_mt": total,
        "sectors_raw": sectors_raw,
        "sectors_normalized": [
            {
                "sector": sector,
                "co2e_mt": round(val),
                "pct": round(val / total * 1000) / 10 if total else 0,
            }
            for sector, val in sector_totals.items()
        ],
    }


def main():
    results = {}
    with httpx.Client() as session:
        for city_id, trace_id in CITY_IDS.items():
            print(f"Fetching {city_id} ({trace_id})…")
            raw = fetch_city(session, city_id, trace_id)
            if raw is None:
                continue

            out_path = RAW_DIR / f"climate_trace_{city_id}.json"
            out_path.write_text(json.dumps(raw, indent=2))

            normalized = normalize(raw, city_id, trace_id)
            results[city_id] = normalized
            print(f"  → {normalized['total_co2e_mt']:,.0f} tonnes CO₂e total")
            time.sleep(0.3)  # be polite to the API

    summary_path = RAW_DIR / "climate_trace_summary.json"
    summary_path.write_text(json.dumps(results, indent=2))
    print(f"\nSaved {len(results)} cities to {RAW_DIR}")
    print("Next: review data/raw/climate_trace_summary.json and update cities_base.json as needed.")


if __name__ == "__main__":
    main()

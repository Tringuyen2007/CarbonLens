#!/usr/bin/env python3
"""
fetch_grid_data.py — Fetch grid carbon intensity and renewable percentage from EIA API v2.

Data is fetched at state level (finest granularity for CO2 emission rates from EIA).
Cities in the same state share the same grid values.

Sources:
  - Generation by fuel type: EIA electric-power-operational-data (annual 2022)
  - CO2 from power sector: EIA co2-emissions-aggregates (annual 2022)

Reads:  data/cities_base.json  (for state codes per city)
Writes: data/raw/grid_data.json (city_id → carbon_intensity, renewable_pct)

Usage (from repo root):
    cd CarbonLens
    python scripts/fetch_grid_data.py

After running, re-seed the database:
    python scripts/seed_database.py
"""

import json
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "server" / ".env")

EIA_API_KEY = os.getenv("EIA_API_KEY", "").strip()
DATA_DIR = Path(__file__).parent.parent / "data"
RAW_DIR = DATA_DIR / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

# Renewable fuel type codes used by EIA electric-power-operational-data
# SUN=solar, WND=wind, HYC=hydro conventional, HPS=pumped storage (excluded — can be negative),
# GEO=geothermal, AOR=other renewables, WAS=biogenic waste, WWW=wood/biomass
RENEWABLE_CODES = {"SUN", "WND", "HYC", "GEO", "AOR", "WAS", "WWW"}

# Most recent complete annual year available from EIA CO2 aggregates
EIA_YEAR = "2022"


def fetch_state_generation(session: httpx.Client, state: str) -> list[dict]:
    """Annual electricity generation by fuel type for a state (thousand MWh)."""
    try:
        r = session.get(
            "https://api.eia.gov/v2/electricity/electric-power-operational-data/data/",
            params={
                "api_key": EIA_API_KEY,
                "frequency": "annual",
                "data[0]": "generation",
                "facets[location][]": state,
                "facets[sectorid][]": "99",  # all sectors
                "start": EIA_YEAR,
                "end": EIA_YEAR,
                "length": 50,
            },
            timeout=20,
        )
        r.raise_for_status()
        return r.json().get("response", {}).get("data", [])
    except Exception as exc:
        print(f"  ERROR generation {state}: {exc}")
        return []


def fetch_state_co2(session: httpx.Client, state: str) -> list[dict]:
    """Annual CO2 emissions from electric power sector for a state (million metric tons)."""
    try:
        r = session.get(
            "https://api.eia.gov/v2/co2-emissions/co2-emissions-aggregates/data/",
            params={
                "api_key": EIA_API_KEY,
                "frequency": "annual",
                "data[0]": "value",
                "facets[stateId][]": state,
                "facets[sectorId][]": "EC",  # Electric Power sector
                "start": EIA_YEAR,
                "end": EIA_YEAR,
                "length": 10,
            },
            timeout=20,
        )
        r.raise_for_status()
        return r.json().get("response", {}).get("data", [])
    except Exception as exc:
        print(f"  ERROR co2 {state}: {exc}")
        return []


def compute_grid_values(
    gen_rows: list[dict], co2_rows: list[dict]
) -> tuple[float | None, float | None]:
    """
    Returns (carbon_intensity in gCO2/kWh, renewable_pct as %).
    generation values are in thousand MWh; CO2 values in million metric tons.
    """
    total_gen_tmwh = next(
        (float(r.get("generation") or 0) for r in gen_rows if r.get("fueltypeid") == "ALL"),
        0,
    )
    renewable_gen = sum(
        float(r.get("generation") or 0)
        for r in gen_rows
        if r.get("fueltypeid") in RENEWABLE_CODES
    )
    total_co2_mmt = next(
        (float(r.get("value") or 0) for r in co2_rows if r.get("fuelId") == "TO"),
        0,
    )

    if not total_gen_tmwh:
        return None, None

    renewable_pct = round(renewable_gen / total_gen_tmwh * 100, 1)

    # carbon_intensity (gCO2/kWh):
    #   total_gen is in thousand MWh = 1e6 kWh per unit
    #   total_co2 is in million metric tons = 1e12 g per unit
    #   intensity = (co2_mmt * 1e12 g) / (gen_tmwh * 1e6 kWh) = co2_mmt * 1e6 / gen_tmwh
    carbon_intensity = round(total_co2_mmt * 1e6 / total_gen_tmwh, 1)

    return carbon_intensity, renewable_pct


def main():
    if not EIA_API_KEY:
        print("ERROR: EIA_API_KEY not set in server/.env")
        return

    cities = json.loads((DATA_DIR / "cities_base.json").read_text())

    # Group cities by state — EIA data is state-level
    state_to_cities: dict[str, list[str]] = {}
    for city in cities:
        state = city["state"]
        state_to_cities.setdefault(state, []).append(city["city_id"])

    results: dict[str, dict] = {}

    with httpx.Client() as session:
        for state, city_ids in sorted(state_to_cities.items()):
            print(f"Fetching EIA data: {state} (cities: {', '.join(city_ids)})…")
            gen_rows = fetch_state_generation(session, state)
            co2_rows = fetch_state_co2(session, state)

            if not gen_rows:
                print(f"  No generation data for {state} — skipping")
                continue

            carbon_intensity, renewable_pct = compute_grid_values(gen_rows, co2_rows)
            print(f"  → carbon_intensity={carbon_intensity} gCO₂/kWh, renewable_pct={renewable_pct}%")

            for city_id in city_ids:
                results[city_id] = {
                    "carbon_intensity": carbon_intensity,
                    "renewable_pct": renewable_pct,
                }

    # DC edge case: DC generates <200 MWh locally (nearly all imported from PJM grid).
    # EIA state-level query returns carbon_intensity=0.0, which is misleading.
    # Override with PJM 2022 regional average (EIA Form 861, 2022 annual report).
    if "dc" in results and (results["dc"].get("carbon_intensity") or 0) < 10:
        print("  DC override: replacing near-zero local generation values with PJM 2022 regional average")
        results["dc"]["carbon_intensity"] = 350.0
        results["dc"]["renewable_pct"] = 24.0

    out_path = RAW_DIR / "grid_data.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\nSaved {len(results)} cities to {out_path}")
    print("Next: python scripts/seed_database.py")


if __name__ == "__main__":
    main()

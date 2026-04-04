# ─────────────────────────────────────────────────────────────────────────────
# Pydantic v2 response schemas
# Field names MUST match mockData.js exactly so the frontend works identically
# whether VITE_USE_MOCK_DATA=true or false.
# ─────────────────────────────────────────────────────────────────────────────

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


# ── Shared sub-models ─────────────────────────────────────────────────────────

class GridInfo(BaseModel):
    region: str
    carbon_intensity: float          # gCO₂/kWh
    renewable_pct: float             # percent


class BPSThreshold(BaseModel):
    period: str
    type: str                        # e.g. "Office", "Large Commercial"
    limit: Optional[float]           # kgCO₂e/sqft; null for benchmark-only cities
    unit: str
    penalty: float                   # $/ton or $/sqft depending on ordinance


class BPSInfo(BaseModel):
    name: str
    status: str                      # "active" | "benchmark"
    thresholds: list[BPSThreshold]
    compliance_gap_pct: float


class Incentive(BaseModel):
    name: str
    type: str
    value: str


class RenewablesInfo(BaseModel):
    solar_ghi: float                 # kWh/m²/day
    wind_avg: float                  # m/s
    rooftop_mw: float                # MW identified rooftop potential
    incentives: list[Incentive]


# ── /v1/cities ────────────────────────────────────────────────────────────────

class CityListItem(BaseModel):
    """Lightweight city object returned by GET /v1/cities (used by map + rankings)."""
    city_id: str
    name: str
    state: str
    lat: float
    lng: float
    total_co2e_mt: float
    co2e_per_capita: float
    has_bps: bool
    trend_yoy: Optional[float]


# ── /v1/cities/{city_id} ──────────────────────────────────────────────────────

class CityDetail(BaseModel):
    """Full city object returned by GET /v1/cities/{city_id} (used by city panel)."""
    city_id: str
    name: str
    state: str
    lat: float
    lng: float
    total_co2e_mt: float
    co2e_per_capita: float
    co2e_year: int
    has_bps: bool
    trend_yoy: Optional[float]
    population: int
    climate_zone: str
    grid: GridInfo
    bps: Optional[BPSInfo]
    renewables: RenewablesInfo
    data_sources: list[str]
    last_updated: str


# ── /v1/emissions/{city_id}/summary ──────────────────────────────────────────

class EmissionSector(BaseModel):
    sector: str                      # "Buildings" | "Transport" | "Industry" | "Waste" | "Other"
    co2e_mt: float
    pct: float
    color: str                       # hex color for chart


class TrendPoint(BaseModel):
    year: int
    co2e_mt: float


class EmissionsSummary(BaseModel):
    city_id: str
    sectors: list[EmissionSector]
    trend_5yr: list[TrendPoint]


# ── /v1/ask ───────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str       # "user" | "assistant"
    content: str


class AskRequest(BaseModel):
    query: str
    city_id: Optional[str] = None
    history: Optional[list[ChatMessage]] = None


class AskSource(BaseModel):
    name: str
    relevance: float


class AskResponse(BaseModel):
    answer: str
    confidence: str                  # "high" | "medium" | "low"
    sources: list[AskSource]
    time_ms: int


# ── /v1/recommendations/{city_id} ────────────────────────────────────────────

class Recommendation(BaseModel):
    rank: int
    category: str
    title: str
    description: str
    impact_pct: float
    confidence: str
    sources: list[str]


class RecommendationsResponse(BaseModel):
    city_id: str
    recommendations: list[Recommendation]
    generated_at: str


# ── /v1/compare ───────────────────────────────────────────────────────────────

class CompareCity(BaseModel):
    city_id: str
    name: str
    state: str
    total_co2e_mt: float
    co2e_per_capita: float
    has_bps: bool
    trend_yoy: Optional[float]
    solar_ghi: Optional[float]
    grid_renewable_pct: Optional[float]
    bps_name: Optional[str]
    population: int


class CompareResponse(BaseModel):
    cities: list[CompareCity]

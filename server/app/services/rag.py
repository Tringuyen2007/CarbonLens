"""
RAG pipeline — Gemini 1.5 Flash (LLM) + ChromaDB default embeddings (local)

Free tier:
  - Google AI Studio key: https://aistudio.google.com/app/apikey
  - Gemini 1.5 Flash: 15 RPM / 1M tokens/day free
  - ChromaDB: local embeddings, no API key needed
"""

import os
import json
import time
import asyncio
from typing import Optional

import google.generativeai as genai
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

# ── Config ────────────────────────────────────────────────────────────────────

CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
COLLECTION_NAME = "carbonlens_docs"
TOP_K = 5  # number of chunks retrieved per query

# Use ChromaDB's built-in local embedding function (no API key needed)
_ef = embedding_functions.DefaultEmbeddingFunction()


def _gemini_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "")
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set.")
    return key

# ── Compliance knowledge base ─────────────────────────────────────────────────
# Covers all 20 cities in MongoDB. Each entry becomes one ChromaDB document.
# Extend this list to add more standards or city-specific docs.

COMPLIANCE_DOCS = [
    # ── City-specific BPS laws ────────────────────────────────────────────────
    {
        "id": "ll97_nyc",
        "city_ids": ["nyc"],
        "name": "NYC Local Law 97 (LL97)",
        "text": (
            "New York City Local Law 97 (LL97) sets annual greenhouse gas emission limits "
            "for buildings over 25,000 sq ft starting in 2024. "
            "Compliance periods: 2024–2029 limit is 6.75 kgCO₂e/sqft for most offices; "
            "2030–2034 limits drop ~40%. Penalty: $268 per metric ton CO₂e over the cap. "
            "Buildings must report annually to NYC DOB. Covers ~50,000 buildings city-wide."
        ),
    },
    {
        "id": "berdo_boston",
        "city_ids": ["boston"],
        "name": "Boston BERDO 2.0",
        "text": (
            "Boston's Building Emissions Reduction and Disclosure Ordinance (BERDO 2.0) "
            "requires large buildings (>20,000 sqft) to meet emissions intensity targets "
            "starting 2025, with declining caps through 2050 net-zero goal. "
            "Annual reporting to the Boston Environment Department is mandatory. "
            "Covers commercial, residential, and mixed-use buildings."
        ),
    },
    {
        "id": "beps_dc",
        "city_ids": ["dc"],
        "name": "DC Building Energy Performance Standards (BEPS)",
        "text": (
            "Washington DC BEPS sets energy performance targets for buildings >50,000 sqft "
            "benchmarked via ENERGY STAR Portfolio Manager. "
            "Buildings must reach the median ENERGY STAR score for their property type "
            "within a 5-year compliance cycle. Non-compliant buildings face fines and "
            "must develop an Audit and Compliance Plan. Enforced by DC DOEE."
        ),
    },
    {
        "id": "energize_denver",
        "city_ids": ["denver"],
        "name": "Energize Denver",
        "text": (
            "Denver's Energize Denver ordinance requires buildings >25,000 sqft to meet "
            "energy performance targets by 2030. Buildings are benchmarked annually using "
            "ENERGY STAR. Targets are set as kBtu/sqft and tighten in 3 compliance cycles "
            "(2023, 2026, 2030). Penalties up to $0.10/sqft/day for non-compliance. "
            "Denver also offers free energy audits for qualifying buildings."
        ),
    },
    {
        "id": "seattle_bps",
        "city_ids": ["seattle"],
        "name": "Seattle Building Performance Standards",
        "text": (
            "Seattle's BPS applies to commercial and multifamily buildings >50,000 sqft. "
            "Buildings must benchmark energy use intensity (EUI) annually via ENERGY STAR. "
            "Seattle's Clean Buildings Act aligns with Washington State Clean Buildings "
            "Performance Standard, requiring EUI targets by 2026 for Tier 1 buildings. "
            "Non-compliant buildings pay $5,000 base fee plus $1/sqft."
        ),
    },
    {
        "id": "chicago_bps",
        "city_ids": ["chicago"],
        "name": "Chicago Building Energy Use Benchmarking Ordinance",
        "text": (
            "Chicago requires annual benchmarking for buildings >50,000 sqft via ENERGY STAR "
            "Portfolio Manager. Chicago BPS proposal (in development) would set hard caps "
            "starting 2026 targeting 80% reduction by 2040. Currently in benchmarking phase. "
            "City publishes an annual Energy Benchmarking Report with building-level data."
        ),
    },
    {
        "id": "ca_title24",
        "city_ids": ["los_angeles", "san_francisco", "san_jose"],
        "name": "California Title 24 / CALGreen",
        "text": (
            "California Title 24 Part 6 sets minimum energy efficiency standards for all "
            "new and renovated buildings. CALGreen (Title 24 Part 11) adds mandatory green "
            "building measures including water efficiency, EV charging readiness, and "
            "construction waste recycling. Updated every 3 years; 2022 code requires "
            "all-electric readiness for new residential. "
            "SB 100 mandates 100% clean electricity by 2045 for California utilities."
        ),
    },
    {
        "id": "portland_carbon",
        "city_ids": ["portland"],
        "name": "Portland Clean Energy Surcharge & Carbon Policy",
        "text": (
            "Portland's Clean Energy Surcharge (Measure 26-201) levies a 1% surcharge on "
            "large retailers to fund clean energy programs for low-income communities. "
            "Oregon's Clean Electricity and Coal Transition Plan phases out coal by 2030 "
            "and targets 100% clean electricity by 2040. Portland also has a Carbon "
            "Emissions Reduction Targets (CERT) framework guiding city operations to "
            "net-zero by 2050."
        ),
    },
    {
        "id": "mn_b3",
        "city_ids": ["minneapolis"],
        "name": "Minnesota B3 Benchmarking & Clean Energy Act",
        "text": (
            "Minnesota's B3 (Buildings, Benchmarks, Beyond) program requires state-owned "
            "buildings to benchmark and reduce energy use. Minneapolis City Resolution "
            "targets 80% GHG reduction by 2050 from 2006 baseline. "
            "Minnesota's 2023 Clean Energy Act mandates 100% carbon-free electricity by "
            "2040. Xcel Energy (Minneapolis grid) has committed to 80% carbon reduction "
            "by 2030."
        ),
    },
    {
        "id": "philly_beps",
        "city_ids": ["philadelphia"],
        "name": "Philadelphia Building Energy Performance Standards",
        "text": (
            "Philadelphia's Building Energy Performance Standards (BEPS) require large "
            "buildings (>50,000 sqft) to meet ENERGY STAR median scores or equivalent "
            "EUI targets. Philadelphia launched a voluntary benchmarking program in 2012 "
            "and moved to mandatory reporting. The Philadelphia Energy Campaign supports "
            "buildings with retrofit financing. Pennsylvania Act 129 mandates utility "
            "energy efficiency programs."
        ),
    },
    # ── Federal / National standards (all cities) ────────────────────────────
    {
        "id": "ashrae_901",
        "city_ids": [],  # empty = applies to all cities
        "name": "ASHRAE 90.1 Energy Standard",
        "text": (
            "ASHRAE Standard 90.1 is the baseline commercial building energy code adopted "
            "by most US states. It sets minimum efficiency requirements for HVAC, lighting, "
            "building envelope, and service water heating. "
            "The 2022 edition targets ~10% energy savings vs 2019. "
            "Most local BPS laws use ASHRAE 90.1 as the baseline for compliance calculations."
        ),
    },
    {
        "id": "energy_star",
        "city_ids": [],
        "name": "EPA ENERGY STAR Portfolio Manager",
        "text": (
            "EPA ENERGY STAR Portfolio Manager is the standard benchmarking tool for US "
            "commercial and multifamily buildings. Buildings receive a 1–100 score; "
            "score ≥75 qualifies for ENERGY STAR certification. "
            "Portfolio Manager is required for benchmarking under most US city BPS laws "
            "(Boston BERDO, DC BEPS, Denver Energize, Seattle BPS, Chicago, Philadelphia). "
            "Free to use; supports whole-building energy and water data."
        ),
    },
    {
        "id": "ira_2022",
        "city_ids": [],
        "name": "Inflation Reduction Act (IRA) 2022",
        "text": (
            "The Inflation Reduction Act (IRA) provides the largest US clean energy "
            "investment in history (~$369 billion). Key provisions: "
            "179D commercial building deduction: up to $5/sqft for energy-efficient upgrades; "
            "45L tax credit: up to $5,000 per new energy-efficient home; "
            "Investment Tax Credit (ITC): 30% for solar, wind, battery storage, geothermal; "
            "Production Tax Credit (PTC): $0.0275/kWh for wind, solar, geothermal; "
            "48C Advanced Manufacturing Credit: 30% for clean energy equipment manufacturing; "
            "EV tax credits: up to $7,500 for new EVs, $4,000 for used EVs. "
            "Credits can be transferred or sold (transferability provisions)."
        ),
    },
    {
        "id": "epa_ghg_reporting",
        "city_ids": [],
        "name": "EPA GHG Reporting Rule (40 CFR Part 98)",
        "text": (
            "EPA's mandatory GHG Reporting Rule requires facilities emitting ≥25,000 metric "
            "tons CO₂e/year to report annually. Covers 41 industrial source categories "
            "including power plants, refineries, cement, steel, and landfills. "
            "Reports submitted via EPA's Electronic GHG Reporting Tool (e-GGRT). "
            "Data is public via EPA's FLIGHT tool. Relevant for industrial-heavy cities "
            "like Houston, Dallas, Chicago, and Los Angeles."
        ),
    },
    {
        "id": "doe_better_buildings",
        "city_ids": [],
        "name": "DOE Better Buildings Initiative",
        "text": (
            "The DOE Better Buildings Initiative is a voluntary federal program where "
            "organizations commit to 20% energy efficiency improvements over 10 years. "
            "Partners include cities, utilities, manufacturers, and commercial real estate. "
            "Offers technical assistance, financing tools, and peer learning. "
            "Better Buildings Challenge participants report annual progress publicly. "
            "Relevant for all 20 cities as a voluntary pathway alongside mandatory BPS."
        ),
    },
    {
        "id": "sec_climate_disclosure",
        "city_ids": [],
        "name": "SEC Climate Disclosure Rule",
        "text": (
            "The SEC's climate-related disclosure rules (adopted 2024) require publicly "
            "traded companies to disclose material climate risks, GHG emissions (Scope 1 & 2), "
            "and climate-related financial impacts in annual reports. "
            "Large accelerated filers must disclose from fiscal year 2025; "
            "smaller companies have phased timelines. "
            "Scope 3 disclosure was removed from the final rule. "
            "Relevant for companies headquartered or operating in all 20 cities."
        ),
    },
    {
        "id": "epa_clean_air_act",
        "city_ids": [],
        "name": "EPA Clean Air Act — GHG Provisions",
        "text": (
            "The Clean Air Act (CAA) requires EPA to regulate GHG emissions from vehicles "
            "and large stationary sources. Key programs: "
            "Tailpipe standards: EPA finalized MY2027+ vehicle emission rules in 2024; "
            "Power plant rule: EPA GHG standards for existing coal and new gas plants; "
            "New Source Review: large industrial projects must obtain pre-construction permits; "
            "Title V operating permits: facilities >100 tons/year GHG must obtain permits. "
            "Relevant for industrial sectors in Houston, Dallas, Chicago, and LA."
        ),
    },
    {
        "id": "carb_regulations",
        "city_ids": ["los_angeles", "san_francisco", "san_jose"],
        "name": "California Air Resources Board (CARB) Regulations",
        "text": (
            "CARB oversees California's Cap-and-Trade Program covering ~85% of state GHG "
            "emissions. Facilities >25,000 tCO₂e/year must acquire allowances. "
            "Advanced Clean Cars II: ban on new gasoline-only vehicle sales by 2035. "
            "Advanced Clean Trucks: zero-emission truck requirements for manufacturers. "
            "CARB's Scoping Plan targets carbon neutrality by 2045. "
            "All three California cities (LA, SF, San Jose) fall under CARB jurisdiction."
        ),
    },
]

# ── ChromaDB + Gemini setup ───────────────────────────────────────────────────

_chroma_client: Optional[chromadb.Client] = None
_collection: Optional[chromadb.Collection] = None


def _get_collection() -> chromadb.Collection:
    global _chroma_client, _collection
    if _collection is not None:
        return _collection

    _chroma_client = chromadb.PersistentClient(
        path=CHROMA_PATH,
        settings=Settings(anonymized_telemetry=False),
    )
    _collection = _chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=_ef,
        metadata={"hnsw:space": "cosine"},
    )
    return _collection


def build_index() -> int:
    """
    Populate ChromaDB with compliance docs. Idempotent — skips docs already indexed.
    Call once on startup. Returns number of documents newly added.
    """
    collection = _get_collection()

    existing_ids = set(collection.get(include=[])["ids"])
    to_add = [doc for doc in COMPLIANCE_DOCS if doc["id"] not in existing_ids]

    if not to_add:
        return 0

    collection.add(
        ids=[doc["id"] for doc in to_add],
        documents=[doc["text"] for doc in to_add],
        metadatas=[
            {"name": doc["name"], "city_ids": ",".join(doc["city_ids"])}
            for doc in to_add
        ],
    )
    return len(to_add)


# ── Main RAG query ────────────────────────────────────────────────────────────

async def query_rag(query: str, city_id: Optional[str] = None) -> dict:
    """
    Retrieve relevant compliance docs and generate an answer with Gemini 1.5 Flash.

    Returns a dict matching AskResponse schema:
      { answer, confidence, sources, time_ms }
    """
    genai.configure(api_key=_gemini_key())
    t0 = time.monotonic()

    collection = _get_collection()
    count = collection.count()
    if count == 0:
        build_index()
        count = collection.count()

    results = collection.query(
        query_texts=[query],
        n_results=min(TOP_K, count),
        include=["documents", "metadatas", "distances"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    if not docs:
        return {
            "answer": "No relevant compliance information found for your query.",
            "confidence": "low",
            "sources": [],
            "time_ms": int((time.monotonic() - t0) * 1000),
        }

    # Build context block for Gemini
    context_block = "\n\n".join(
        f"[{meta['name']}]\n{doc}" for doc, meta in zip(docs, metas)
    )

    city_context = f" for {city_id.replace('_', ' ').title()}" if city_id else ""

    prompt = f"""You are CarbonLens AI, an expert on US building emissions compliance and clean energy standards.
Answer the following question{city_context} using ONLY the provided compliance documents.
Be specific, cite the standard names, and give actionable guidance. If the documents don't contain enough information, say so.

COMPLIANCE DOCUMENTS:
{context_block}

QUESTION: {query}

ANSWER:"""

    model = genai.GenerativeModel("gemini-2.0-flash-lite")
    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,
            max_output_tokens=512,
        ),
    )

    try:
        answer = response.text.strip()
    except Exception:
        answer = "Unable to generate a response. Please try rephrasing your question."

    # Derive confidence from best retrieval distance (cosine; 0=perfect, 2=opposite)
    best_distance = distances[0] if distances else 1.0
    if best_distance < 0.25:
        confidence = "high"
    elif best_distance < 0.55:
        confidence = "medium"
    else:
        confidence = "low"

    sources = [
        {
            "name": meta["name"],
            "relevance": round(1.0 - dist / 2.0, 3),  # convert distance → similarity
        }
        for meta, dist in zip(metas, distances)
    ]

    return {
        "answer": answer,
        "confidence": confidence,
        "sources": sources,
        "time_ms": int((time.monotonic() - t0) * 1000),
    }


# ── Generate city recommendations ─────────────────────────────────────────────

async def generate_recommendations(city_doc: dict, emissions_doc: dict) -> list[dict]:
    """
    Given a city document and its emissions summary from MongoDB, retrieve
    relevant compliance docs and ask Gemini to produce structured recommendations.

    Returns a list of dicts matching the Recommendation schema.
    """
    genai.configure(api_key=_gemini_key())

    city_id = city_doc.get("city_id", "")
    city_name = city_doc.get("name", city_id)
    state = city_doc.get("state", "")

    # Build a concise city summary for the prompt
    bps = city_doc.get("bps")
    bps_text = (
        f"{bps['name']} (status: {bps['status']}, compliance gap: {bps['compliance_gap_pct']}%)"
        if bps else "No active BPS law"
    )

    sectors = emissions_doc.get("sectors", [])
    sector_text = "; ".join(
        f"{s['sector']} {s['pct']}%" for s in sorted(sectors, key=lambda x: -x["pct"])
    )

    grid = city_doc.get("grid", {})
    renewables = city_doc.get("renewables", {})

    city_context = f"""
City: {city_name}, {state}
Total CO2e: {city_doc.get('total_co2e_mt')} metric tons
Per capita: {city_doc.get('co2e_per_capita')} tCO2e/person
YoY trend: {city_doc.get('trend_yoy')}%
Climate zone: {city_doc.get('climate_zone')}
Population: {city_doc.get('population')}

Emissions by sector: {sector_text}

Grid: {grid.get('region')} — {grid.get('carbon_intensity')} gCO2/kWh, {grid.get('renewable_pct')}% renewable
Solar GHI: {renewables.get('solar_ghi')} kWh/m2/day
Wind avg: {renewables.get('wind_avg')} m/s
Rooftop solar potential: {renewables.get('rooftop_mw')} MW

Building performance standard: {bps_text}
""".strip()

    # Retrieve compliance docs for this city
    collection = _get_collection()
    count = collection.count()
    if count == 0:
        build_index()
        count = collection.count()

    query_text = f"sustainability recommendations compliance standards {city_name} {state} emissions reduction"

    results = collection.query(
        query_texts=[query_text],
        n_results=min(6, count),
        include=["documents", "metadatas"],
    )

    compliance_block = "\n\n".join(
        f"[{meta['name']}]\n{doc}"
        for doc, meta in zip(results["documents"][0], results["metadatas"][0])
    )

    prompt = f"""You are CarbonLens AI, an expert in US city sustainability and building emissions compliance.

Given the following city profile and applicable compliance standards, generate exactly 4 ranked sustainability recommendations.

CITY PROFILE:
{city_context}

APPLICABLE COMPLIANCE STANDARDS:
{compliance_block}

Return ONLY a valid JSON array with exactly 4 objects. No markdown, no explanation — just the raw JSON array.
Each object must have these exact fields:
- "rank": integer 1-4
- "category": one of [building_electrification, solar, transit, industrial, grid, policy, building_efficiency]
- "title": short action title (max 8 words)
- "description": 2-3 sentence actionable description referencing specific standards
- "impact_pct": estimated emissions reduction percentage as a float (e.g. 8.5)
- "confidence": one of ["high", "medium", "low"]
- "sources": array of 1-3 strings naming the specific standards or data sources cited

JSON array:"""

    model = genai.GenerativeModel("gemini-2.0-flash-lite")
    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,
            max_output_tokens=1024,
        ),
    )

    try:
        raw = response.text.strip()
    except Exception:
        raise RuntimeError("Gemini returned an empty or blocked response. Try again.")

    # Strip markdown code fences if Gemini wraps the output
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    # Find the JSON array boundaries in case Gemini adds extra text
    start = raw.find("[")
    end = raw.rfind("]") + 1
    if start == -1 or end == 0:
        raise RuntimeError(f"Gemini did not return a JSON array. Response: {raw[:200]}")
    raw = raw[start:end]

    try:
        recommendations = json.loads(raw)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Gemini JSON: {e}. Raw: {raw[:200]}")

    # Validate each item has required fields; fill safe defaults if missing
    required = {"rank", "category", "title", "description", "impact_pct", "confidence", "sources"}
    cleaned = []
    for i, rec in enumerate(recommendations):
        if not isinstance(rec, dict):
            continue
        rec.setdefault("rank", i + 1)
        rec.setdefault("category", "default")
        rec.setdefault("title", "Sustainability Action")
        rec.setdefault("description", "")
        rec.setdefault("impact_pct", 0.0)
        rec.setdefault("confidence", "medium")
        rec.setdefault("sources", [])
        cleaned.append(rec)

    if not cleaned:
        raise RuntimeError("Gemini returned no valid recommendations.")

    return cleaned


# ── AI Emission Analyst chat — OpenAI gpt-4o-mini ────────────────────────────
# Completely separate from Gemini code above. Only called by /v1/ask.

MAX_HISTORY_TURNS = 4   # keep last 4 user+assistant pairs = 8 messages max
TOP_K_CHAT = 3          # fewer chunks = fewer tokens


def _openai_key() -> str:
    key = os.getenv("OPENAI_API_KEY", "")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set.")
    return key


def _trim_city_context(city_doc: dict, emissions_doc: dict) -> str:
    """Build a compact city summary — only fields useful for compliance chat."""
    if not city_doc:
        return ""

    bps = city_doc.get("bps")
    bps_text = (
        f"{bps['name']} (status: {bps['status']}, compliance gap: {bps['compliance_gap_pct']}%)"
        if bps else "No active BPS law"
    )

    sectors = sorted(
        emissions_doc.get("sectors", []), key=lambda x: -x.get("pct", 0)
    )[:2]  # top 2 sectors only
    sector_text = ", ".join(f"{s['sector']} {s['pct']}%" for s in sectors)

    grid = city_doc.get("grid", {})

    return (
        f"City: {city_doc.get('name')}, {city_doc.get('state')} | "
        f"Total CO2e: {city_doc.get('total_co2e_mt')} MT | "
        f"Top sectors: {sector_text} | "
        f"Grid: {grid.get('renewable_pct')}% renewable, {grid.get('carbon_intensity')} gCO2/kWh | "
        f"BPS: {bps_text}"
    )


async def query_rag_openai(
    query: str,
    city_id: Optional[str] = None,
    history: Optional[list] = None,
    city_doc: Optional[dict] = None,
    emissions_doc: Optional[dict] = None,
) -> dict:
    """
    AI Emission Analyst chat using OpenAI gpt-4o-mini + ChromaDB retrieval.
    Token-efficient: top-3 chunks, max 4 history turns, trimmed city context.

    history format: [{"role": "user"|"assistant", "content": "..."}]
    """
    from openai import OpenAI

    t0 = time.monotonic()
    client = OpenAI(api_key=_openai_key())

    # Retrieve top-3 compliance chunks from ChromaDB
    collection = _get_collection()
    count = collection.count()
    if count == 0:
        build_index()
        count = collection.count()

    results = collection.query(
        query_texts=[query],
        n_results=min(TOP_K_CHAT, count),
        include=["documents", "metadatas", "distances"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    compliance_block = "\n".join(
        f"[{meta['name']}] {doc[:300]}"  # cap each chunk at 300 chars
        for doc, meta in zip(docs, metas)
    )

    # Compact city context if available
    city_context = ""
    if city_doc and emissions_doc:
        city_context = f"\nSelected city data: {_trim_city_context(city_doc, emissions_doc)}"

    system_prompt = (
        "You are an AI Emission Analyst for CarbonLens, specializing in US city carbon emissions "
        "and building compliance standards. Answer concisely using the compliance context provided. "
        "Cite specific standards by name. If unsure, say so — do not fabricate numbers."
        f"{city_context}\n\n"
        f"Relevant compliance standards:\n{compliance_block}"
    )

    # Build messages: system + trimmed history + current question
    trimmed_history = (history or [])[-MAX_HISTORY_TURNS * 2:]
    messages = (
        [{"role": "system", "content": system_prompt}]
        + trimmed_history
        + [{"role": "user", "content": query}]
    )

    response = await asyncio.to_thread(
        client.chat.completions.create,
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=400,
        temperature=0.2,
    )

    answer = response.choices[0].message.content.strip()

    best_distance = distances[0] if distances else 1.0
    if best_distance < 0.25:
        confidence = "high"
    elif best_distance < 0.55:
        confidence = "medium"
    else:
        confidence = "low"

    sources = [
        {"name": meta["name"], "relevance": round(1.0 - dist / 2.0, 3)}
        for meta, dist in zip(metas, distances)
    ]

    return {
        "answer": answer,
        "confidence": confidence,
        "sources": sources,
        "time_ms": int((time.monotonic() - t0) * 1000),
    }

# CarbonLens

An AI-powered platform for analyzing urban carbon emissions and building energy compliance across 20 major US cities. Built for EcoHack 2026.

CarbonLens combines real emissions data from Climate TRACE, NREL, and EIA with a retrieval-augmented AI system to help city planners, sustainability officers, and researchers understand compliance requirements, benchmark building performance, and surface actionable decarbonization recommendations.

---

## Features

- **Interactive emissions map** — 20 US cities with sector-level CO2e breakdowns (Buildings, Transport, Industry, Waste)
- **Building Performance Standards tracker** — Live compliance status against NYC LL97, Boston BERDO 2.0, DC BEPS, Denver Energize Denver, and more
- **AI Emissions Analyst** — Multi-turn chat grounded in 18 real compliance documents via RAG (ChromaDB + GPT-4o-mini)
- **AI-generated recommendations** — City-specific decarbonization strategies ranked by estimated impact (Gemini 2.0 Flash Lite)
- **City comparison** — Side-by-side analysis of up to 5 cities
- **What-if scenarios** — Slider-based projection of emissions reductions
- **5-year trend charts** — Historical 2019–2023 emissions trends per city
- **PDF export** — Download city reports
- **Offline demo mode** — Full UI with mock data, no backend required

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Leaflet, GSAP |
| Backend | FastAPI, Python 3.x, Uvicorn |
| Database | MongoDB Atlas (Motor async driver) |
| Vector Store | ChromaDB (local, no API key required) |
| AI — Chat | OpenAI GPT-4o-mini |
| AI — Recommendations | Google Gemini 2.0 Flash Lite |
| Data Sources | Climate TRACE API v7, NREL API, EIA API |

---

## Repository Structure

```
CarbonLens/
├── client/             # React + Vite frontend
│   ├── src/
│   │   ├── pages/      # LandingPage, AnalysisPage, RankingsPage
│   │   ├── components/ # Map, CityPanel, Chat, WhatIf, ui
│   │   ├── lib/        # API wrapper, formatters, colors
│   │   └── data/       # mockData.js (offline demo fallback)
│   └── vite.config.js  # Dev proxy: /v1 → localhost:8000
├── server/             # FastAPI backend
│   ├── app/
│   │   ├── main.py     # App entry point, CORS, lifespan hooks
│   │   ├── routes/     # cities, emissions, ask, recommend, compare
│   │   └── services/   # MongoDB client, RAG pipeline
│   └── requirements.txt
├── scripts/            # Data pipeline
│   ├── fetch_climate_trace.py
│   ├── fetch_solar_data.py
│   ├── fetch_grid_data.py
│   └── seed_database.py
└── data/
    ├── cities_base.json            # Curated data for 20 cities
    ├── egrid_subregion_map.json
    └── raw/                        # Cached API responses
```

---

## Quickstart

### Option A — Offline Demo (no accounts required)

The frontend includes a full mock dataset and can run standalone.

```bash
cd client
npm install
```

Create `client/.env.local`:
```
VITE_USE_MOCK_DATA=true
```

```bash
npm run dev
# Open http://localhost:5173
```

All features are available in demo mode except live AI chat and real-time data refresh.

---

### Option B — Full Stack (live AI + real data)

#### 1. Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (free tier works) — [cloud.mongodb.com](https://cloud.mongodb.com)
- API keys (all free tiers available):
  - OpenAI — [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  - Google Gemini — [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
  - NREL — [developer.nrel.gov/signup](https://developer.nrel.gov/signup/)
  - EIA — [www.eia.gov/opendata](https://www.eia.gov/opendata/)

#### 2. Backend setup

```bash
cd server
pip install -r requirements.txt
```

Create `server/.env` from the example:
```bash
cp .env.example .env
```

Fill in your values:
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/carbonlens
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
NREL_API_KEY=...
EIA_API_KEY=...
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
CHROMA_PATH=./chroma_db
```

#### 3. Seed the database

```bash
cd ..
python scripts/seed_database.py
```

This loads `data/cities_base.json` into MongoDB and pre-populates the 20-city dataset.

#### 4. Start the backend

```bash
cd server
uvicorn app.main:app --reload
# API available at http://localhost:8000
# Health check: http://localhost:8000/health
```

#### 5. Start the frontend

```bash
cd client
npm install
```

Create `client/.env.local`:
```
VITE_USE_MOCK_DATA=false
```

```bash
npm run dev
# Open http://localhost:5173
```

The Vite dev server proxies `/v1/*` requests to `localhost:8000` automatically.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/v1/cities` | List all 20 cities |
| GET | `/v1/cities/{city_id}` | Full city detail (BPS status, grid, renewables, incentives) |
| GET | `/v1/emissions/{city_id}/summary` | Sector breakdown + 5-year trend |
| POST | `/v1/ask` | AI chat with RAG over compliance documents |
| GET | `/v1/recommendations/{city_id}` | Cached AI recommendations |
| POST | `/v1/recommendations/{city_id}/generate` | Generate new recommendations via Gemini |
| GET | `/v1/compare?cities=nyc,boston,dc` | Compare up to 5 cities |

Interactive API docs are served at `http://localhost:8000/docs` when the backend is running.

---

## Cities Covered

New York City, Boston, Washington DC, Denver, Seattle, San Francisco, Los Angeles, Chicago, Houston, Austin, Portland, Miami, Atlanta, St. Louis, Phoenix, Minneapolis, San Diego, Dallas, Detroit, Philadelphia

---

## Compliance Standards in the RAG Knowledge Base

**City-Level BPS Laws:** NYC LL97, Boston BERDO 2.0, DC BEPS, Denver Energize Denver, Seattle BPS, Chicago Energy Benchmarking, California Title 24 / CALGreen (LA, SF, San Jose), Portland Clean Energy Surcharge, Minnesota B3, Philadelphia BEPS

**Federal & National:** ASHRAE 90.1, EPA ENERGY STAR Portfolio Manager, Inflation Reduction Act (2022), EPA GHG Reporting Rule (40 CFR Part 98), DOE Better Buildings Initiative, SEC Climate Disclosure Rule, Clean Air Act, California CARB Cap-and-Trade

---

## Data Sources

| Source | Data Type | Access |
|---|---|---|
| Climate TRACE API v7 | Sector-level CO2e emissions (2019–2023) | Public, no key required |
| NREL | Solar GHI, wind potential, rooftop capacity | Free API key |
| EIA | Grid carbon intensity, renewable percentage | Free API key |

Raw API responses are cached under `data/raw/` so the app works without re-fetching.

---

## Production Build

```bash
cd client
npm run build       # Outputs to client/dist/
npm run preview     # Serves the production build locally
```

For deployment, serve the `dist/` folder from any static host (Vercel, Netlify, S3) and point `VITE_API_BASE_URL` to your deployed FastAPI instance.

---

## License

MIT

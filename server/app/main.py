# ─────────────────────────────────────────────────────────────────────────────
# CarbonLens FastAPI application
# Start: uvicorn app.main:app --reload  (from the server/ directory)
# ─────────────────────────────────────────────────────────────────────────────

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services import mongo
from app.services.rag import build_index
from app.routes import cities, emissions, ask, recommend, compare

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mongo.connect()
    try:
        added = build_index()
        if added:
            print(f"[RAG] Indexed {added} new compliance documents into ChromaDB.")
        else:
            print("[RAG] ChromaDB index already up to date.")
    except Exception as e:
        print(f"[RAG] Skipping index build: {e}")
    yield
    await mongo.disconnect()


app = FastAPI(
    title="CarbonLens API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173")
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ── Routes — all mounted under /v1 to match Vite proxy config ─────────────────
PREFIX = "/v1"
app.include_router(cities.router,    prefix=PREFIX)
app.include_router(emissions.router, prefix=PREFIX)
app.include_router(ask.router,       prefix=PREFIX)
app.include_router(recommend.router, prefix=PREFIX)
app.include_router(compare.router,   prefix=PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok", "db": mongo.is_connected()}

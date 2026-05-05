from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from ..config import settings
from ..models import User
from ..security import get_current_user

router = APIRouter(prefix="/rawg", tags=["rawg"])

RAWG_BASE = "https://api.rawg.io/api"


@router.get("/search")
async def search(q: str = Query(min_length=1), _: User = Depends(get_current_user)):
    if not settings.RAWG_API_KEY:
        raise HTTPException(503, "RAWG_API_KEY not configured")
    async with httpx.AsyncClient(timeout=15) as hc:
        r = await hc.get(
            f"{RAWG_BASE}/games",
            params={"key": settings.RAWG_API_KEY, "search": q, "page_size": 20},
        )
    if r.status_code != 200:
        raise HTTPException(502, "RAWG error")
    return {"results": r.json().get("results", [])}


@router.get("/games/{id_or_slug}")
async def get_game(id_or_slug: str, _: User = Depends(get_current_user)):
    if not settings.RAWG_API_KEY:
        raise HTTPException(503, "RAWG_API_KEY not configured")
    async with httpx.AsyncClient(timeout=15) as hc:
        r = await hc.get(f"{RAWG_BASE}/games/{id_or_slug}", params={"key": settings.RAWG_API_KEY})
    if r.status_code != 200:
        raise HTTPException(502, "RAWG error")
    return r.json()

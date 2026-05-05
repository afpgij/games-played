from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .models import GameStatus


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    name: str | None
    image: str | None


class GameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    rawg_id: int | None
    slug: str | None
    title: str
    cover: str | None
    released: str | None


class EntryCreate(BaseModel):
    rawg_id: int | None = None
    title: str
    cover: str | None = None
    slug: str | None = None
    released: str | None = None
    platform: str = Field(min_length=1, max_length=64)
    hours: float = Field(default=0, ge=0)
    rating: int | None = Field(default=None, ge=1, le=10)
    review: str | None = Field(default=None, max_length=5000)
    status: GameStatus = GameStatus.PLAYING


class EntryUpdate(BaseModel):
    platform: str | None = Field(default=None, min_length=1, max_length=64)
    hours: float | None = Field(default=None, ge=0)
    rating: int | None = Field(default=None, ge=1, le=10)
    review: str | None = Field(default=None, max_length=5000)
    status: GameStatus | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None


class EntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    platform: str
    hours: float
    rating: int | None
    review: str | None
    status: GameStatus
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime
    updated_at: datetime
    game: GameOut


class TokenPair(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RawgGame(BaseModel):
    id: int
    slug: str
    name: str
    released: str | None = None
    background_image: str | None = None
    rating: float | None = None
    platforms: list[dict] | None = None

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..db import get_db
from ..models import Game, GameEntry, User
from ..schemas import EntryCreate, EntryOut, EntryUpdate
from ..security import get_current_user

router = APIRouter(prefix="/entries", tags=["entries"])


@router.get("", response_model=list[EntryOut])
def list_entries(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = (
        select(GameEntry)
        .where(GameEntry.user_id == user.id)
        .options(joinedload(GameEntry.game))
        .order_by(GameEntry.updated_at.desc())
    )
    return db.scalars(stmt).all()


@router.post("", response_model=EntryOut, status_code=201)
def create_entry(payload: EntryCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game: Game | None = None
    if payload.rawg_id is not None:
        game = db.query(Game).filter_by(rawg_id=payload.rawg_id).one_or_none()
    if game is None:
        game = Game(
            rawg_id=payload.rawg_id,
            slug=payload.slug,
            title=payload.title,
            cover=payload.cover,
            released=payload.released,
        )
        db.add(game)
        db.flush()
    else:
        game.title = payload.title
        game.cover = payload.cover or game.cover
        game.released = payload.released or game.released

    entry = GameEntry(
        user_id=user.id,
        game_id=game.id,
        platform=payload.platform,
        hours=payload.hours,
        rating=payload.rating,
        review=payload.review,
        status=payload.status,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{entry_id}", response_model=EntryOut)
def update_entry(
    entry_id: int,
    payload: EntryUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.get(GameEntry, entry_id)
    if not entry or entry.user_id != user.id:
        raise HTTPException(404, "Not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entry = db.get(GameEntry, entry_id)
    if not entry or entry.user_id != user.id:
        raise HTTPException(404, "Not found")
    db.delete(entry)
    db.commit()

from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import RefreshToken, User
from ..oauth import oauth
from ..schemas import UserOut
from ..security import (
    REFRESH_COOKIE,
    clear_auth_cookies,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    revoke_refresh,
    set_auth_cookies,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _upsert_user(db: Session, *, provider: str, provider_id: str, email: str, name: str | None, image: str | None) -> User:
    user = db.query(User).filter_by(provider=provider, provider_id=provider_id).one_or_none()
    if user is None:
        user = User(provider=provider, provider_id=provider_id, email=email, name=name, image=image)
        db.add(user)
    else:
        user.email = email
        user.name = name
        user.image = image
    db.commit()
    db.refresh(user)
    return user


def _issue_session(db: Session, user: User, response: Response, remember: bool = True) -> None:
    access, _ = create_access_token(user.id)
    refresh, refresh_exp = create_refresh_token(db, user.id, remember=remember)
    set_auth_cookies(response, access, refresh, refresh_exp)


@router.get("/login/{provider}")
async def login(provider: str, request: Request):
    if provider not in ("google", "discord"):
        raise HTTPException(404, "Unknown provider")
    client = oauth.create_client(provider)
    if client is None:
        raise HTTPException(503, f"{provider} not configured")
    redirect_uri = f"{settings.BACKEND_URL.rstrip('/')}/auth/callback/{provider}"
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/callback/{provider}")
async def callback(provider: str, request: Request, db: Session = Depends(get_db)):
    if provider not in ("google", "discord"):
        raise HTTPException(404, "Unknown provider")
    client = oauth.create_client(provider)
    if client is None:
        raise HTTPException(503, f"{provider} not configured")
    token = await client.authorize_access_token(request)

    if provider == "google":
        info = token.get("userinfo")
        if not info:
            async with httpx.AsyncClient() as hc:
                r = await hc.get(
                    "https://openidconnect.googleapis.com/v1/userinfo",
                    headers={"Authorization": f"Bearer {token['access_token']}"},
                )
                info = r.json()
        user = _upsert_user(
            db,
            provider="google",
            provider_id=info["sub"],
            email=info.get("email", ""),
            name=info.get("name"),
            image=info.get("picture"),
        )
    else:
        async with httpx.AsyncClient() as hc:
            r = await hc.get(
                "https://discord.com/api/users/@me",
                headers={"Authorization": f"Bearer {token['access_token']}"},
            )
            info = r.json()
        avatar = (
            f"https://cdn.discordapp.com/avatars/{info['id']}/{info['avatar']}.png"
            if info.get("avatar")
            else None
        )
        user = _upsert_user(
            db,
            provider="discord",
            provider_id=str(info["id"]),
            email=info.get("email", ""),
            name=info.get("global_name") or info.get("username"),
            image=avatar,
        )

    response = RedirectResponse(settings.FRONTEND_URL.rstrip("/") + "/library")
    _issue_session(db, user, response, remember=True)
    return response


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh cookie")
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")
    jti = payload.get("jti")
    rt = db.query(RefreshToken).filter_by(jti=jti).one_or_none()
    if rt is None or rt.revoked_at is not None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh revoked")
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")

    revoke_refresh(db, jti)
    _issue_session(db, user, response, remember=True)
    return {"ok": True}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(REFRESH_COOKIE)
    if token:
        try:
            payload = decode_token(token)
            if payload.get("jti"):
                revoke_refresh(db, payload["jti"])
        except HTTPException:
            pass
    clear_auth_cookies(response)
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user

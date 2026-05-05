from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import RefreshToken, User

ACCESS_COOKIE = "gp_access"
REFRESH_COOKIE = "gp_refresh"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(user_id: int) -> tuple[str, int]:
    expires = _now() + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
    payload = {"sub": str(user_id), "type": "access", "exp": expires, "iat": _now()}
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, settings.ACCESS_TOKEN_MINUTES * 60


def create_refresh_token(db: Session, user_id: int, remember: bool) -> tuple[str, datetime]:
    days = settings.REFRESH_TOKEN_DAYS_REMEMBER if remember else settings.REFRESH_TOKEN_DAYS
    expires = _now() + timedelta(days=days)
    jti = secrets.token_urlsafe(32)
    db.add(RefreshToken(user_id=user_id, jti=jti, expires_at=expires))
    db.commit()
    payload = {"sub": str(user_id), "type": "refresh", "jti": jti, "exp": expires, "iat": _now()}
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, expires


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token") from e


def revoke_refresh(db: Session, jti: str) -> None:
    rt = db.query(RefreshToken).filter_by(jti=jti).one_or_none()
    if rt and rt.revoked_at is None:
        rt.revoked_at = _now()
        db.commit()


def set_auth_cookies(response, access: str, refresh: str, refresh_expires: datetime) -> None:
    common = {
        "httponly": True,
        "secure": settings.COOKIE_SECURE,
        "samesite": "lax",
        "domain": settings.COOKIE_DOMAIN,
        "path": "/",
    }
    response.set_cookie(
        ACCESS_COOKIE,
        access,
        max_age=settings.ACCESS_TOKEN_MINUTES * 60,
        **common,
    )
    response.set_cookie(
        REFRESH_COOKIE,
        refresh,
        expires=refresh_expires,
        **common,
    )


def clear_auth_cookies(response) -> None:
    for c in (ACCESS_COOKIE, REFRESH_COOKIE):
        response.delete_cookie(c, domain=settings.COOKIE_DOMAIN, path="/")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user

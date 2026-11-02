"""
JWT Authentication Service - Enterprise Anti-Forgery

Protections:
- algorithms=["HS256"] explicit (blocks alg:none and RS256 confusion attacks)
- Short-lived access tokens (30 min)
- Refresh tokens stored hashed in DB (revocable on logout)
- bcrypt password hashing (cost factor 12)
- Token type validation (access vs refresh can't be swapped)
"""

import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import AdminUser, get_db

security_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def _hash_refresh_token(token: str) -> str:
    """Hash refresh token for DB storage (not reversible)."""
    return hashlib.sha256(token.encode()).hexdigest()


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str, expected_type: str = "access") -> dict:
    """Decode and validate JWT token.

    Anti-forgery: algorithms list is EXPLICIT - only HS256 accepted.
    This prevents alg:none attacks and RS256/HS256 key confusion.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],  # EXPLICIT - anti alg:none
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid sau expirat",
        )

    if payload.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tip token invalid",
        )

    return payload


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    """FastAPI dependency - validates JWT and returns admin user.

    Usage: admin: AdminUser = Depends(get_current_admin)
    """
    payload = decode_token(credentials.credentials, expected_type="access")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid",
        )

    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilizator negasit",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cont dezactivat",
        )

    return user


def validate_secret_key():
    """Call at startup to ensure SECRET_KEY is not default."""
    if settings.SECRET_KEY == "change-me-in-production":
        raise RuntimeError(
            "SECURITY ERROR: SECRET_KEY is still the default value! "
            "Set a strong SECRET_KEY (min 32 chars) in your .env file."
        )
    if len(settings.SECRET_KEY) < 32:
        raise RuntimeError(
            f"SECURITY ERROR: SECRET_KEY too short ({len(settings.SECRET_KEY)} chars). "
            "Must be at least 32 characters."
        )

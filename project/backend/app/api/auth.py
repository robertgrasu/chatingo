from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.models.database import AdminUser, get_db
from app.models.schemas import (
    AdminResetPasswordRequest,
    ChangePasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RefreshRequest,
    TokenResponse,
    UserCreateRequest,
    UserDetailResponse,
    UserResponse,
    UserUpdateRequest,
)
from app.rate_limiter import limiter
from app.services.auth import (
    _hash_refresh_token,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_admin,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.username == data.username).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username sau parola incorecta",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cont dezactivat",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Store hashed refresh token in DB (revocable)
    user.refresh_token = _hash_refresh_token(refresh_token)
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh(request: Request, data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token, expected_type="refresh")

    user_id = payload.get("sub")
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid",
        )

    # Verify refresh token matches DB (prevents use of revoked tokens)
    token_hash = _hash_refresh_token(data.refresh_token)
    if user.refresh_token != token_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revocat",
        )

    # Issue new access token, keep same refresh token (no rotation)
    # Refresh token is still revocable via logout/password change
    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=data.refresh_token,
    )


@router.post("/logout")
async def logout(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Revoke refresh token by clearing from DB
    admin.refresh_token = None
    db.commit()
    return {"status": "ok"}


@router.get("/me", response_model=UserResponse)
async def get_me(admin: AdminUser = Depends(get_current_admin)):
    return UserResponse(
        id=admin.id,
        username=admin.username,
        email=admin.email,
        role=admin.role,
    )


@router.put("/change-password")
@limiter.limit("3/minute")
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parola curenta incorecta",
        )

    admin.password_hash = hash_password(data.new_password)
    # Revoke refresh token on password change (force re-login)
    admin.refresh_token = None
    db.commit()

    return {"status": "ok", "message": "Parola schimbata cu succes"}


# ── Profile Update ─────────────────────────────────────────────


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: ProfileUpdateRequest,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if data.username is not None:
        existing = (
            db.query(AdminUser)
            .filter(AdminUser.username == data.username, AdminUser.id != admin.id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Acest username este deja folosit",
            )
        admin.username = data.username

    if data.email is not None:
        admin.email = data.email

    db.commit()
    db.refresh(admin)

    return UserResponse(
        id=admin.id,
        username=admin.username,
        email=admin.email,
        role=admin.role,
    )


# ── User Management (admin-only) ──────────────────────────────


@router.get("/users", response_model=list[UserDetailResponse])
async def list_users(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.query(AdminUser).order_by(AdminUser.created_at.desc()).all()
    return [
        UserDetailResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at.isoformat() if u.created_at else "",
            last_login=u.last_login.isoformat() if u.last_login else None,
        )
        for u in users
    ]


@router.post("/users", response_model=UserDetailResponse, status_code=201)
async def create_user(
    data: UserCreateRequest,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(AdminUser).filter(AdminUser.username == data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Acest username exista deja",
        )

    user = AdminUser(
        username=data.username,
        password_hash=hash_password(data.password),
        email=data.email,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserDetailResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else "",
        last_login=None,
    )


@router.put("/users/{user_id}", response_model=UserDetailResponse)
async def update_user(
    user_id: str,
    data: UserUpdateRequest,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negasit")

    if data.username is not None:
        existing = (
            db.query(AdminUser)
            .filter(AdminUser.username == data.username, AdminUser.id != user_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Acest username este deja folosit",
            )
        user.username = data.username

    if data.email is not None:
        user.email = data.email
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
        if not data.is_active:
            user.refresh_token = None  # Force logout

    db.commit()
    db.refresh(user)

    return UserDetailResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else "",
        last_login=user.last_login.isoformat() if user.last_login else None,
    )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nu iti poti sterge propriul cont",
        )

    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negasit")

    db.delete(user)
    db.commit()
    return {"status": "deleted"}


@router.put("/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: str,
    data: AdminResetPasswordRequest,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negasit")

    user.password_hash = hash_password(data.new_password)
    user.refresh_token = None  # Force re-login
    db.commit()

    return {"status": "ok", "message": "Parola resetata cu succes"}

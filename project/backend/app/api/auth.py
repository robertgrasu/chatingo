from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.models.database import AdminUser, OperatorStatus, get_db
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
from app.services.ownership import team_root_id
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


# Autentificarea adminului: verifica parola si returneaza token-urile; limitata la 5 cereri pe minut
@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    # Mesajul de eroare este acelasi pentru utilizator inexistent si parola gresita, ca sa nu se dezvaluie ce conturi exista
    user = db.query(AdminUser).filter(AdminUser.username == data.username).first()

    # Eroare identica pentru utilizator inexistent si parola gresita
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

    # Se salveaza in baza de date doar hash-ul token-ului de refresh, ca sa poata fi revocat
    user.refresh_token = _hash_refresh_token(refresh_token)
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


# Genereaza un token de acces nou pe baza token-ului de refresh, daca acesta nu a fost revocat
@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh(request: Request, data: RefreshRequest, db: Session = Depends(get_db)):
    # Se valideaza token-ul de refresh si se identifica utilizatorul din el
    payload = decode_token(data.refresh_token, expected_type="refresh")

    # Utilizatorul se identifica prin campul sub din token
    user_id = payload.get("sub")
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid",
        )

    # Token-ul trebuie sa corespunda cu cel din baza de date, altfel este considerat revocat
    token_hash = _hash_refresh_token(data.refresh_token)
    if user.refresh_token != token_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revocat",
        )

    # Se emite un token de acces nou, iar token-ul de refresh ramane acelasi (fara rotatie)
    # Token-ul de refresh poate fi revocat la logout sau la schimbarea parolei
    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=data.refresh_token,
    )


# Deconectarea: revoca token-ul de refresh salvat in baza de date
@router.post("/logout")
async def logout(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Se revoca token-ul de refresh prin stergerea lui din baza de date
    admin.refresh_token = None
    db.commit()
    return {"status": "ok"}


# Returneaza datele utilizatorului autentificat
@router.get("/me", response_model=UserResponse)
async def get_me(admin: AdminUser = Depends(get_current_admin)):
    return UserResponse(
        id=admin.id,
        username=admin.username,
        email=admin.email,
        role=admin.role,
    )


# Schimba parola utilizatorului curent si il obliga sa se autentifice din nou
@router.put("/change-password")
@limiter.limit("3/minute")
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Parola curenta trebuie sa fie corecta inainte de schimbare
    if not verify_password(data.current_password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parola curenta incorecta",
        )

    # Se salveaza hash-ul parolei noi
    admin.password_hash = hash_password(data.new_password)
    # La schimbarea parolei token-ul se revoca, deci utilizatorul trebuie sa se autentifice din nou
    admin.refresh_token = None
    db.commit()

    return {"status": "ok", "message": "Parola schimbata cu succes"}


# ── Actualizarea profilului ─────────────────────────────────


# Actualizeaza numele de utilizator si emailul utilizatorului curent
@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: ProfileUpdateRequest,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Numele de utilizator trebuie sa fie unic, deci se verifica daca nu e deja folosit
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

    # Emailul se actualizeaza doar daca a fost trimis
    if data.email is not None:
        admin.email = data.email

    db.commit()
    # Se reincarca obiectul din baza de date, cu valorile salvate
    db.refresh(admin)

    return UserResponse(
        id=admin.id,
        username=admin.username,
        email=admin.email,
        role=admin.role,
    )


# ── Managementul utilizatorilor ──────────────────────────────


# Returneaza lista tuturor utilizatorilor, cei mai noi primii
@router.get("/users", response_model=list[UserDetailResponse])
async def list_users(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Se aduc toti utilizatorii, cei mai noi primii
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


# Creeaza un utilizator nou care intra in echipa celui care l-a creat
@router.post("/users", response_model=UserDetailResponse, status_code=201)
async def create_user(
    data: UserCreateRequest,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Se refuza crearea daca numele de utilizator exista deja
    existing = db.query(AdminUser).filter(AdminUser.username == data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Acest username exista deja",
        )

    # Se construieste utilizatorul nou, cu parola hashuita
    user = AdminUser(
        username=data.username,
        password_hash=hash_password(data.password),
        email=data.email,
        role=data.role,
        # Conturile noi intra in echipa celui care le creeaza, deci vad aceiasi boti
        team_owner_id=team_root_id(admin) if data.role != "demo" else None,
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


# Actualizeaza datele unui utilizator; dezactivarea lui il deconecteaza imediat
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
            user.refresh_token = None  # deconectare fortata

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


# Sterge un utilizator (adminul nu isi poate sterge propriul cont)
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Adminul nu isi poate sterge propriul cont
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nu iti poti sterge propriul cont",
        )

    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negasit")

    # Se sterge statusul de operator inainte de utilizator, din cauza cheii straine
    db.query(OperatorStatus).filter(OperatorStatus.admin_user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"status": "deleted"}


# Reseteaza parola unui utilizator si il obliga sa se autentifice din nou
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
    user.refresh_token = None  # autentificare din nou obligatorie
    db.commit()

    return {"status": "ok", "message": "Parola resetata cu succes"}

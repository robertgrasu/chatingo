# Controlul accesului la boti pe echipe: un bot apartine echipei (BotConfig.owner_id este id-ul adminului radacina)
# Un admin creat din managementul utilizatorilor mosteneste echipa celui care l-a creat, deci vede aceiasi boti
# Rolul demo vede toti botii (ca demo-ul public sa aiba ce arata), dar middleware-ul DemoReadOnlyMiddleware ii blocheaza orice scriere
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.database import AdminUser, BotConfig


# Returneaza id-ul sub care sunt salvati botii echipei adminului: radacina echipei sau adminul insusi
def team_root_id(admin: AdminUser) -> str:
    # Adminul radacina are team_owner_id gol, deci botii lui sunt salvati sub propriul id
    return admin.team_owner_id or admin.id


# Se verifica daca adminul are voie sa acceseze botul dat (demo vede toti botii, restul doar ai echipei)
def can_access_bot(bot: BotConfig, admin: AdminUser) -> bool:
    if admin.role == "demo":
        return True
    return bot.owner_id == team_root_id(admin)


# Se cauta botul in baza de date si se returneaza doar daca echipa adminului il poate accesa
def get_owned_bot(bot_id: str, db: Session, admin: AdminUser) -> BotConfig:
    # Se incarca botul dupa id
    bot = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()
    # Se returneaza 404 si cand botul exista dar apartine altei echipe, ca sa nu se dezvaluie existenta lui
    if not bot or not can_access_bot(bot, admin):
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot


# Varianta usoara a verificarii: nu incarca botul complet, doar confirma ca exista si e al echipei
def ensure_bot_accessible(bot_id: str, db: Session, admin: AdminUser) -> None:
    # Rolul demo are acces de citire la toti botii
    if admin.role == "demo":
        return
    # Se verifica doar existenta botului in echipa, fara a incarca toate coloanele
    owned = (
        db.query(BotConfig.bot_id)
        .filter(BotConfig.bot_id == bot_id, BotConfig.owner_id == team_root_id(admin))
        .first()
    )
    if not owned:
        raise HTTPException(status_code=404, detail="Bot not found")


# Returneaza lista id-urilor de boti ai echipei, folosita la filtrarea listelor (None = fara restrictii)
def owned_bot_ids(db: Session, admin: AdminUser) -> list[str] | None:
    if admin.role == "demo":
        return None
    # Se extrag doar id-urile botilor echipei
    return [
        b[0]
        for b in db.query(BotConfig.bot_id).filter(BotConfig.owner_id == team_root_id(admin)).all()
    ]

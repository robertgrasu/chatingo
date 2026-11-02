import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from app.api import admin, auth, chat, livechat, widget, ws_operator, ws_visitor
from app.config import settings
from app.models.database import AdminUser, get_db, init_db
from app.rate_limiter import limiter
from app.services.auth import decode_token, validate_secret_key

# Aplicatia FastAPI principala, cu limitatorul de cereri atasat
app = FastAPI(title="RAG Chatbot API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Rolul demo nu are voie sa scrie: cererile de scriere sunt blocate de middleware
WRITE_METHODS = {"POST", "PUT", "DELETE", "PATCH"}
DEMO_ALLOWED_PATHS = {"/api/auth/login", "/api/auth/refresh", "/api/auth/logout"}

# Middleware care blocheaza orice scriere (POST, PUT, DELETE, PATCH) pentru conturile cu rolul demo
class DemoReadOnlyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Doar cererile de scriere cu token valid sunt verificate; login-ul si logout-ul raman permise
        if request.method in WRITE_METHODS and request.url.path not in DEMO_ALLOWED_PATHS:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]
                try:
                    # Se citeste id-ul utilizatorului din token si se verifica rolul lui in baza de date
                    payload = decode_token(token, expected_type="access")
                    user_id = payload.get("sub")
                    if user_id:
                        db = next(get_db())
                        try:
                            user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
                            if user and user.role == "demo":
                                return JSONResponse(
                                    status_code=403,
                                    content={"detail": "Cont demo - modificările nu sunt permise"},
                                )
                        finally:
                            db.close()
                except Exception:
                    pass
        return await call_next(request)


# Middleware care adauga headerele de securitate la fiecare raspuns
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        # Headerele opresc ghicirea tipului de fisier, ascunderea in iframe si trimiterea nenecesara a referrer-ului
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Politica de continut permite doar resurse din acelasi domeniu
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
        return response


# Ordinea middleware-urilor conteaza: ultimul adaugat ruleaza primul
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(DemoReadOnlyMiddleware)

# CORS permite orice origine, pentru ca widget-ul trebuie sa mearga pe orice site al clientilor
# Rutele de admin sunt protejate de JWT, nu de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Se inregistreaza rutele
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(widget.router, prefix="/api", tags=["Widget"])
app.include_router(livechat.router, prefix="/api", tags=["LiveChat"])
app.include_router(ws_visitor.router, tags=["WebSocket"])
app.include_router(ws_operator.router, tags=["WebSocket"])

# Se serveste folderul static (widget-ul compilat, avatarele si imaginile incarcate)
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


# La pornire se valideaza cheia secreta, se pregateste baza de date si se migreaza datele vechi din ChromaDB
@app.on_event("startup")
async def startup():
    # Se valideaza setarile de securitate
    validate_secret_key()

    # Se creeaza tabelele si datele implicite
    init_db()
    # Bucatile vechi din ChromaDB primesc bot_id
    from app.services.embeddings import migrate_chunks_add_bot_id
    try:
        count = migrate_chunks_add_bot_id()
        if count > 0:
            print(f"Migrated {count} ChromaDB chunks to include bot_id")
    except Exception as e:
        print(f"ChromaDB migration note: {e}")


# Ruta de verificare care arata ca API-ul ruleaza
@app.get("/")
async def root():
    return {"message": "RAG Chatbot API is running"}
